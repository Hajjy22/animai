import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { addMotionComponent } from "../dist/inject.js";
import type { RegistrySource } from "../dist/registry-client.js";
import type { RegistryEntry } from "../dist/registry-types.js";
import { updateMotionComponent } from "../dist/update.js";
import { computeChecksum } from "../dist/checksum.js";
import { cleanupDir, tempDir, writeBasicRoute } from "./helpers.ts";

const dirs: string[] = [];
function freshDir(prefix: string): string {
  const dir = tempDir(prefix);
  dirs.push(dir);
  return dir;
}
after(() => dirs.forEach(cleanupDir));

function entry(version: string, code = "v1"): RegistryEntry {
  const target_code = `export default function Widget() { return <div>${code}</div>; }\n`;
  const loader_code = `export function WidgetSlot() { return <Widget />; }\n`;
  return {
    template_id: "widget",
    version,
    tier: "free",
    title: "Widget",
    summary: "",
    framework: "nextjs-r3f",
    framework_targets: ["nextjs-app-router"],
    component_filename: "Widget.tsx",
    loader_filename: "WidgetSlot.tsx",
    loader_export: "WidgetSlot",
    dependencies: [],
    peer_dep_ranges: {},
    integration_instructions: [],
    preview_url: "",
    vetting_report: {
      dispose_audit: "pass",
      ssr_safe: true,
      vram_leak: false,
      fps_budget: 60,
      measured_fps: null,
      method: "static",
      verified_at: null,
      harness_version: null,
    },
    tags: [],
    target_code,
    loader_code,
    // Real algorithm (not an arbitrary label) so the fixture is internally
    // consistent, exactly like the real registry build.
    checksum: computeChecksum(target_code, loader_code),
  };
}

function sourceReturning(e: RegistryEntry): RegistrySource {
  return {
    mode: "local",
    async list() {
      return [];
    },
    async search() {
      return [];
    },
    async fetch() {
      return e;
    },
  };
}

async function installV1(projectRoot: string): Promise<void> {
  writeBasicRoute(projectRoot);
  await addMotionComponent({
    cwd: projectRoot,
    templateId: "widget",
    componentsDir: "app/components",
    routePath: "app/page.tsx",
    dryRun: false,
    source: sourceReturning(entry("1.0.0", "v1")),
  });
}

test("update reports not_installed when there is no lock entry and no files", async () => {
  const projectRoot = freshDir("update-none");
  writeBasicRoute(projectRoot);
  const result = await updateMotionComponent({
    cwd: projectRoot,
    templateId: "widget",
    componentsDir: "app/components",
    routePath: "app/page.tsx",
    dryRun: false,
    force: false,
    source: sourceReturning(entry("1.0.0")),
  });
  assert.equal(result.status, "not_installed");
});

test("update reports up_to_date when the remote checksum matches the lock", async () => {
  const projectRoot = freshDir("update-uptodate");
  await installV1(projectRoot);
  const result = await updateMotionComponent({
    cwd: projectRoot,
    templateId: "widget",
    componentsDir: "app/components",
    routePath: "app/page.tsx",
    dryRun: false,
    force: false,
    source: sourceReturning(entry("1.0.0", "v1")),
  });
  assert.equal(result.status, "up_to_date");
});

test("update applies a clean version bump with no local edits and no --force", async () => {
  const projectRoot = freshDir("update-clean");
  await installV1(projectRoot);
  const result = await updateMotionComponent({
    cwd: projectRoot,
    templateId: "widget",
    componentsDir: "app/components",
    routePath: "app/page.tsx",
    dryRun: false,
    force: false,
    source: sourceReturning(entry("2.0.0", "v2")),
  });
  assert.equal(result.status, "updated");
  const written = readFileSync(path.join(projectRoot, "app/components/Widget.tsx"), "utf8");
  assert.match(written, /v2/);
  const lock = JSON.parse(readFileSync(path.join(projectRoot, ".animai/installed.json"), "utf8"));
  assert.equal(lock.widget.version, "2.0.0");
});

test("update blocks on hand-edited local files without --force", async () => {
  const projectRoot = freshDir("update-drift");
  await installV1(projectRoot);
  const componentPath = path.join(projectRoot, "app/components/Widget.tsx");
  const original = readFileSync(componentPath, "utf8");
  writeFileSync(componentPath, `${original}// hand edit\n`, "utf8");

  const result = await updateMotionComponent({
    cwd: projectRoot,
    templateId: "widget",
    componentsDir: "app/components",
    routePath: "app/page.tsx",
    dryRun: false,
    force: false,
    source: sourceReturning(entry("2.0.0", "v2")),
  });
  assert.equal(result.status, "local_changes");
  // Must not have overwritten the hand edit.
  assert.match(readFileSync(componentPath, "utf8"), /hand edit/);
});

test("update --force overwrites hand-edited local files", async () => {
  const projectRoot = freshDir("update-force");
  await installV1(projectRoot);
  const componentPath = path.join(projectRoot, "app/components/Widget.tsx");
  const original = readFileSync(componentPath, "utf8");
  writeFileSync(componentPath, `${original}// hand edit\n`, "utf8");

  const result = await updateMotionComponent({
    cwd: projectRoot,
    templateId: "widget",
    componentsDir: "app/components",
    routePath: "app/page.tsx",
    dryRun: false,
    force: true,
    source: sourceReturning(entry("2.0.0", "v2")),
  });
  assert.equal(result.status, "updated");
  const written = readFileSync(componentPath, "utf8");
  assert.match(written, /v2/);
  assert.doesNotMatch(written, /hand edit/);
});

test("update --dry-run reports 'updated' but writes nothing", async () => {
  const projectRoot = freshDir("update-dryrun");
  await installV1(projectRoot);
  const componentPath = path.join(projectRoot, "app/components/Widget.tsx");
  const before = readFileSync(componentPath, "utf8");

  const result = await updateMotionComponent({
    cwd: projectRoot,
    templateId: "widget",
    componentsDir: "app/components",
    routePath: "app/page.tsx",
    dryRun: true,
    force: false,
    source: sourceReturning(entry("2.0.0", "v2")),
  });
  assert.equal(result.status, "updated");
  assert.equal(readFileSync(componentPath, "utf8"), before);
});
