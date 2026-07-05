import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cacheDir as defaultCacheDir } from "./config.js";
import {
  fetchMotionComponent,
  getComponent,
  listMotionComponents,
  rankSearchResults,
} from "./registry.js";
import type { MotionSearchResult, RegistryEntry } from "./registry-types.js";

const FRESH_TTL_MS = 24 * 60 * 60 * 1000; // 24h freshness; stale is still served on network failure.
const DEFAULT_PRICING_URL = "https://animai.dev/pricing";

function proLockError(templateId: string, upgradeUrl = DEFAULT_PRICING_URL): RegistryError {
  return new RegistryError(
    "upgrade_required",
    `"${templateId}" is a Pro component. Set a license key with \`animai login <key>\` or ANIMAI_LICENSE_KEY.`,
    upgradeUrl,
  );
}

export type RegistryErrorCode =
  | "upgrade_required"
  | "not_found"
  | "network"
  | "invalid_response";

export class RegistryError extends Error {
  readonly code: RegistryErrorCode;
  readonly upgradeUrl?: string;

  constructor(code: RegistryErrorCode, message: string, upgradeUrl?: string) {
    super(message);
    this.name = "RegistryError";
    this.code = code;
    this.upgradeUrl = upgradeUrl;
  }
}

export type RegistrySource = {
  /** Where components are ultimately coming from, for diagnostics. */
  readonly mode: "local" | "remote";
  list(): Promise<MotionSearchResult[]>;
  search(query: string, limit: number): Promise<MotionSearchResult[]>;
  fetch(templateId: string): Promise<RegistryEntry>;
};

export type RegistrySourceOptions = {
  registryUrl?: string;
  licenseKey?: string;
  offline?: boolean;
  cacheDir?: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
};

/**
 * Builds the registry source. When no registry URL is configured (or `offline`
 * is set) this is the bundled local registry — no network, current behavior.
 * When a URL is present it becomes remote-first with a disk cache and a local
 * fallback, so a flaky CDN never breaks `add`.
 */
export function createRegistrySource(
  options: RegistrySourceOptions = {},
): RegistrySource {
  if (options.offline || !options.registryUrl) {
    return localSource();
  }
  return remoteSource(options.registryUrl, options);
}

function localSource(): RegistrySource {
  return {
    mode: "local",
    async list() {
      return listMotionComponents();
    },
    async search(query, limit) {
      return rankSearchResults(listMotionComponents(), query, limit);
    },
    async fetch(templateId) {
      const local = getComponent(templateId);
      if (!local) {
        throw new RegistryError(
          "not_found",
          `Component "${templateId}" is not in the local registry.`,
        );
      }
      if (local.locked) {
        throw proLockError(templateId);
      }
      return fetchMotionComponent(templateId);
    },
  };
}

function remoteSource(
  baseUrl: string,
  options: RegistrySourceOptions,
): RegistrySource {
  const doFetch = options.fetchImpl ?? fetch;
  const cache = createDiskCache(options.cacheDir ?? defaultCacheDir());

  async function getIndex(): Promise<MotionSearchResult[]> {
    try {
      const response = await doFetch(`${baseUrl}/index.json`);
      if (!response.ok) {
        throw new RegistryError(
          "network",
          `Registry index responded ${response.status}.`,
        );
      }
      const body = (await response.json()) as unknown;
      const results = normalizeIndex(body);
      cache.write("index.json", results);
      return results;
    } catch {
      const cached = cache.read<MotionSearchResult[]>("index.json");
      if (cached) {
        return cached.value;
      }
      return listMotionComponents();
    }
  }

  return {
    mode: "remote",
    async list() {
      return getIndex();
    },
    async search(query, limit) {
      return rankSearchResults(await getIndex(), query, limit);
    },
    async fetch(templateId) {
      const cacheKey = path.posix.join("components", `${templateId}.json`);
      try {
        const headers: Record<string, string> = {};
        if (options.licenseKey) {
          headers.Authorization = `Bearer ${options.licenseKey}`;
        }
        const response = await doFetch(
          `${baseUrl}/components/${encodeURIComponent(templateId)}.json`,
          { headers },
        );

        if (response.status === 401 || response.status === 402 || response.status === 403) {
          throw proLockError(templateId, `${baseUrl}/pricing`);
        }
        if (response.status === 404) {
          throw new RegistryError(
            "not_found",
            `Component "${templateId}" was not found in the registry.`,
          );
        }
        if (!response.ok) {
          throw new RegistryError("network", `Registry responded ${response.status}.`);
        }

        const body = (await response.json()) as unknown;
        // A static CDN serves a "locked" stub (no code) for Pro components; the
        // licensed Worker serves the real payload. Treat the stub like a 402.
        if (isLockedStub(body)) {
          throw proLockError(templateId, `${baseUrl}/pricing`);
        }
        const entry = normalizeEntry(body);
        cache.write(cacheKey, entry);
        return entry;
      } catch (error) {
        // A definitive pro-lock or not-found answer should surface, not fall back.
        if (error instanceof RegistryError && error.code === "upgrade_required") {
          throw error;
        }
        // Network/transient failure: prefer cached, then the bundled local copy.
        const cached = cache.read<RegistryEntry>(cacheKey);
        if (cached) {
          return cached.value;
        }
        const local = getComponent(templateId);
        if (local) {
          if (local.locked) {
            throw proLockError(templateId, `${baseUrl}/pricing`);
          }
          return fetchMotionComponent(templateId);
        }
        if (error instanceof RegistryError) {
          throw error;
        }
        throw new RegistryError(
          "network",
          `Could not reach the registry and "${templateId}" is not cached or bundled locally.`,
        );
      }
    },
  };
}

type CacheRecord<T> = { value: T; storedAt: number; fresh: boolean };

function createDiskCache(dir: string) {
  return {
    read<T>(key: string): CacheRecord<T> | null {
      try {
        const raw = readFileSync(path.join(dir, key), "utf8");
        const parsed = JSON.parse(raw) as { storedAt: number; value: T };
        return {
          value: parsed.value,
          storedAt: parsed.storedAt,
          fresh: Date.now() - parsed.storedAt < FRESH_TTL_MS,
        };
      } catch {
        return null;
      }
    },
    write<T>(key: string, value: T): void {
      try {
        const file = path.join(dir, key);
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(
          file,
          JSON.stringify({ storedAt: Date.now(), value }, null, 2),
          "utf8",
        );
      } catch {
        // Cache is best-effort; failing to write must never break a fetch.
      }
    },
  };
}

function normalizeIndex(body: unknown): MotionSearchResult[] {
  const list = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { components?: unknown }).components)
      ? (body as { components: unknown[] }).components
      : null;

  if (!list) {
    throw new RegistryError("invalid_response", "Registry index is not an array.");
  }

  return list.map((item) => {
    const entry = item as Partial<MotionSearchResult> & { template_id?: string };
    if (!entry.template_id) {
      throw new RegistryError("invalid_response", "Registry index entry missing template_id.");
    }
    return {
      template_id: entry.template_id,
      title: entry.title ?? entry.template_id,
      summary: entry.summary ?? "",
      framework: entry.framework ?? "",
      tier: entry.tier ?? "free",
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      add_command: entry.add_command ?? `npx animai add ${entry.template_id}`,
    };
  });
}

/**
 * True when the CDN returned a Pro "locked stub": an entry explicitly marked
 * `locked`, or a `pro`-tier entry with no source code. Either way the real
 * payload is only available from the licensed Worker.
 */
function isLockedStub(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  const entry = body as { locked?: unknown; tier?: unknown; target_code?: unknown };
  if (entry.locked === true) {
    return true;
  }
  return entry.tier === "pro" && typeof entry.target_code !== "string";
}

function normalizeEntry(body: unknown): RegistryEntry {
  const entry = body as Partial<RegistryEntry> & { template_id?: string };
  if (!entry || typeof entry !== "object" || !entry.template_id) {
    throw new RegistryError("invalid_response", "Registry component payload missing template_id.");
  }
  if (typeof entry.target_code !== "string" || typeof entry.loader_code !== "string") {
    throw new RegistryError(
      "invalid_response",
      `Registry payload for "${entry.template_id}" is missing component code.`,
    );
  }
  return entry as RegistryEntry;
}
