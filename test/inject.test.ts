import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { addMotionComponent, patchNextRouteSource } from "../dist/inject.js";
import type { RegistrySource } from "../dist/registry-client.js";
import type { RegistryEntry } from "../dist/registry-types.js";
import { cleanupDir, tempDir, writeBasicRoute } from "./helpers.ts";

const dirs: string[] = [];
function freshDir(prefix: string): string {
  const dir = tempDir(prefix);
  dirs.push(dir);
  return dir;
}
after(() => dirs.forEach(cleanupDir));

function fakeEntry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  return {
    template_id: "widget",
    version: "1.0.0",
    tier: "free",
    title: "Widget",
    summary: "A test widget.",
    framework: "nextjs-r3f",
    framework_targets: ["nextjs-app-router"],
    component_filename: "Widget.tsx",
    loader_filename: "WidgetSlot.tsx",
    loader_export: "WidgetSlot",
    dependencies: ["three"],
    peer_dep_ranges: { react: ">=18.0.0" },
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
    target_code: 'export default function Widget() { return <div>widget</div>; }\n',
    loader_code: 'export function WidgetSlot() { return <Widget />; }\n',
    checksum: "test-checksum",
    ...overrides,
  };
}

function fakeSource(entry: RegistryEntry): RegistrySource {
  return {
    mode: "local",
    async list() {
      return [];
    },
    async search() {
      return [];
    },
    async fetch() {
      return entry;
    },
  };
}

// --- patchNextRouteSource (pure AST logic) ---

test("patchNextRouteSource injects into an existing <main>", () => {
  const source = `export default function Home() {\n  return (\n    <main>\n      <p>hi</p>\n    </main>\n  );\n}\n`;
  const result = patchNextRouteSource({
    source,
    importPath: "./components/WidgetSlot",
    exportName: "WidgetSlot",
  });
  assert.equal(result.changed, true);
  assert.match(result.source, /import \{ WidgetSlot \} from "\.\/components\/WidgetSlot";/);
  assert.match(result.source, /<main>\s*<WidgetSlot \/>/);
});

test("patchNextRouteSource falls back to the outermost element when there's no <main>", () => {
  const source = `export default function Home() {\n  return (\n    <div className="wrapper">\n      <p>hi</p>\n    </div>\n  );\n}\n`;
  const result = patchNextRouteSource({
    source,
    importPath: "./components/WidgetSlot",
    exportName: "WidgetSlot",
  });
  assert.equal(result.changed, true);
  assert.match(result.source, /<div className="wrapper">\s*<WidgetSlot \/>/);
});

test("patchNextRouteSource honors an explicit --target element", () => {
  const source = `export default function Home() {\n  return (\n    <main>\n      <section>\n        <p>hi</p>\n      </section>\n    </main>\n  );\n}\n`;
  const result = patchNextRouteSource({
    source,
    importPath: "./components/WidgetSlot",
    exportName: "WidgetSlot",
    target: "section",
  });
  assert.match(result.source, /<section>\s*<WidgetSlot \/>/);
});

test("patchNextRouteSource throws a clear error when the requested --target doesn't exist", () => {
  const source = `export default function Home() {\n  return (\n    <main>\n      <p>hi</p>\n    </main>\n  );\n}\n`;
  assert.throws(
    () =>
      patchNextRouteSource({
        source,
        importPath: "./components/WidgetSlot",
        exportName: "WidgetSlot",
        target: "article",
      }),
    /Could not find a <article> element/,
  );
});

test("patchNextRouteSource is idempotent: re-patching an already-patched route makes no changes", () => {
  const source = `export default function Home() {\n  return (\n    <main>\n      <p>hi</p>\n    </main>\n  );\n}\n`;
  const first = patchNextRouteSource({
    source,
    importPath: "./components/WidgetSlot",
    exportName: "WidgetSlot",
  });
  const second = patchNextRouteSource({
    source: first.source,
    importPath: "./components/WidgetSlot",
    exportName: "WidgetSlot",
  });
  assert.equal(second.changed, false);
  assert.equal(second.source, first.source);
});

// --- addMotionComponent (filesystem + source integration) ---

test("addMotionComponent writes component/loader files and patches the route", async () => {
  const projectRoot = freshDir("add-basic");
  writeBasicRoute(projectRoot);

  const result = await addMotionComponent({
    cwd: projectRoot,
    templateId: "widget",
    componentsDir: "app/components",
    routePath: "app/page.tsx",
    dryRun: false,
    source: fakeSource(fakeEntry()),
  });

  assert.equal(result.wrote_component, true);
  assert.equal(result.patched_route, true);
  assert.ok(existsSync(path.join(projectRoot, "app/components/Widget.tsx")));
  assert.ok(existsSync(path.join(projectRoot, "app/components/WidgetSlot.tsx")));
  const route = readFileSync(path.join(projectRoot, "app/page.tsx"), "utf8");
  assert.match(route, /<WidgetSlot \/>/);

  const lock = JSON.parse(
    readFileSync(path.join(projectRoot, ".animai/installed.json"), "utf8"),
  );
  assert.equal(lock.widget.version, "1.0.0");
  // Lock paths must be posix so they resolve on any OS/CI runner.
  assert.ok(!lock.widget.component_path.includes("\\"));
});

test("addMotionComponent --dry-run writes nothing", async () => {
  const projectRoot = freshDir("add-dry-run");
  writeBasicRoute(projectRoot);

  const result = await addMotionComponent({
    cwd: projectRoot,
    templateId: "widget",
    componentsDir: "app/components",
    routePath: "app/page.tsx",
    dryRun: true,
    source: fakeSource(fakeEntry()),
  });

  assert.equal(result.wrote_component, false);
  assert.ok(!existsSync(path.join(projectRoot, "app/components/Widget.tsx")));
  assert.ok(!existsSync(path.join(projectRoot, ".animai/installed.json")));
});

test("addMotionComponent refuses to write outside the project root", async () => {
  const projectRoot = freshDir("add-traversal");
  writeBasicRoute(projectRoot);

  await assert.rejects(
    () =>
      addMotionComponent({
        cwd: projectRoot,
        templateId: "widget",
        componentsDir: "../../etc",
        routePath: "app/page.tsx",
        dryRun: false,
        source: fakeSource(fakeEntry()),
      }),
    /Refusing to write outside the project root/,
  );
});

test("addMotionComponent throws for a locked (Pro, uninjected) entry", async () => {
  const projectRoot = freshDir("add-locked");
  writeBasicRoute(projectRoot);

  await assert.rejects(
    () =>
      addMotionComponent({
        cwd: projectRoot,
        templateId: "widget",
        componentsDir: "app/components",
        routePath: "app/page.tsx",
        dryRun: false,
        source: fakeSource(fakeEntry({ locked: true, target_code: "", loader_code: "" })),
      }),
    /Pro component; its source is not bundled/,
  );
});
