import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createRegistrySource, RegistryError } from "../dist/registry-client.js";
import { cleanupDir, tempDir } from "./helpers.ts";

const dirs: string[] = [];
function freshCacheDir(): string {
  const dir = tempDir("registry-cache");
  dirs.push(dir);
  return dir;
}
after(() => dirs.forEach(cleanupDir));

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// --- local source (no registry URL configured) ---

test("local source fetches a bundled free component", async () => {
  const source = createRegistrySource({});
  assert.equal(source.mode, "local");
  const entry = await source.fetch("hero-orbital-rig");
  assert.equal(entry.template_id, "hero-orbital-rig");
  assert.ok(entry.target_code.length > 0);
});

test("local source throws not_found for an unknown template id", async () => {
  const source = createRegistrySource({});
  await assert.rejects(
    () => source.fetch("does-not-exist"),
    (error: unknown) => error instanceof RegistryError && error.code === "not_found",
  );
});

test("local source throws upgrade_required for a locked (Pro) component", async () => {
  const source = createRegistrySource({});
  await assert.rejects(
    () => source.fetch("particle-field-bg"),
    (error: unknown) => error instanceof RegistryError && error.code === "upgrade_required",
  );
});

test("offline flag forces local mode even with a registry URL configured", async () => {
  const source = createRegistrySource({ registryUrl: "http://example.invalid", offline: true });
  assert.equal(source.mode, "local");
});

// --- remote source ---

test("remote source fetches a free component and caches it", async () => {
  let calls = 0;
  const cacheDir = freshCacheDir();
  const fetchImpl = (async (input: string | URL) => {
    calls += 1;
    const url = String(input);
    if (url.endsWith("/components/widget.json")) {
      return jsonResponse(200, { template_id: "widget", target_code: "x", loader_code: "y" });
    }
    throw new Error(`unexpected url ${url}`);
  }) as typeof fetch;

  const source = createRegistrySource({
    registryUrl: "http://example.invalid",
    cacheDir,
    fetchImpl,
  });
  const entry = await source.fetch("widget");
  assert.equal(entry.template_id, "widget");
  assert.equal(calls, 1);
});

test("remote source maps 401/402/403 to upgrade_required", async () => {
  for (const status of [401, 402, 403]) {
    const fetchImpl = (async () =>
      new Response(null, { status })) as typeof fetch;
    const source = createRegistrySource({
      registryUrl: "http://example.invalid",
      cacheDir: freshCacheDir(),
      fetchImpl,
    });
    await assert.rejects(
      () => source.fetch("widget"),
      (error: unknown) => error instanceof RegistryError && error.code === "upgrade_required",
      `status ${status} should map to upgrade_required`,
    );
  }
});

test("remote source maps 404 to not_found", async () => {
  const fetchImpl = (async () => new Response(null, { status: 404 })) as typeof fetch;
  const source = createRegistrySource({
    registryUrl: "http://example.invalid",
    cacheDir: freshCacheDir(),
    fetchImpl,
  });
  await assert.rejects(
    () => source.fetch("widget"),
    (error: unknown) => error instanceof RegistryError && error.code === "not_found",
  );
});

test("remote source treats a locked stub (200 + no code) as upgrade_required, not a valid payload", async () => {
  const fetchImpl = (async () =>
    jsonResponse(200, { template_id: "widget", tier: "pro", locked: true })) as typeof fetch;
  const source = createRegistrySource({
    registryUrl: "http://example.invalid",
    cacheDir: freshCacheDir(),
    fetchImpl,
  });
  await assert.rejects(
    () => source.fetch("widget"),
    (error: unknown) => error instanceof RegistryError && error.code === "upgrade_required",
  );
});

test("remote source falls back to the disk cache on a network failure", async () => {
  const cacheDir = freshCacheDir();
  let call = 0;
  const fetchImpl = (async (input: string | URL) => {
    call += 1;
    if (call === 1) {
      return jsonResponse(200, { template_id: "widget", target_code: "cached-x", loader_code: "cached-y" });
    }
    throw new Error("network down");
  }) as typeof fetch;

  const source = createRegistrySource({ registryUrl: "http://example.invalid", cacheDir, fetchImpl });
  const first = await source.fetch("widget"); // populates cache
  assert.equal(first.target_code, "cached-x");

  const second = await source.fetch("widget"); // network throws this time -> served from cache
  assert.equal(second.target_code, "cached-x");
});

test("remote source falls back to the bundled local copy when there's no cache and the network fails", async () => {
  const fetchImpl = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  const source = createRegistrySource({
    registryUrl: "http://example.invalid",
    cacheDir: freshCacheDir(),
    fetchImpl,
  });
  const entry = await source.fetch("hero-orbital-rig");
  assert.equal(entry.template_id, "hero-orbital-rig");
  assert.ok(entry.target_code.length > 0);
});

test("remote source does NOT fall back to a locked local bundle copy — upgrade_required still surfaces", async () => {
  const fetchImpl = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  const source = createRegistrySource({
    registryUrl: "http://example.invalid",
    cacheDir: freshCacheDir(),
    fetchImpl,
  });
  await assert.rejects(
    () => source.fetch("particle-field-bg"),
    (error: unknown) => error instanceof RegistryError && error.code === "upgrade_required",
  );
});

test("remote source sends the license key as a Bearer header", async () => {
  let seenAuth: string | null = null;
  const fetchImpl = (async (_input: string | URL, init?: RequestInit) => {
    seenAuth = (init?.headers as Record<string, string> | undefined)?.Authorization ?? null;
    return jsonResponse(200, { template_id: "widget", target_code: "x", loader_code: "y" });
  }) as typeof fetch;

  const source = createRegistrySource({
    registryUrl: "http://example.invalid",
    cacheDir: freshCacheDir(),
    licenseKey: "SECRET-KEY",
    fetchImpl,
  });
  await source.fetch("widget");
  assert.equal(seenAuth, "Bearer SECRET-KEY");
});
