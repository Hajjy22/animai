import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { runDoctor } from "../dist/doctor.js";
import type { RegistryEntry } from "../dist/registry-types.js";
import { cleanupDir, tempDir } from "./helpers.ts";

const dirs: string[] = [];
function freshDir(prefix: string): string {
  const dir = tempDir(prefix);
  dirs.push(dir);
  return dir;
}
after(() => dirs.forEach(cleanupDir));

function installDependency(projectRoot: string, name: string, version: string): void {
  const dir = path.join(projectRoot, "node_modules", name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name, version }), "utf8");
}

function fakeEntry(peerDepRanges: Record<string, string>): RegistryEntry {
  return {
    template_id: "widget",
    version: "1.0.0",
    tier: "free",
    title: "Widget",
    summary: "",
    framework: "nextjs-r3f",
    framework_targets: ["nextjs-app-router"],
    component_filename: "Widget.tsx",
    loader_filename: "WidgetSlot.tsx",
    loader_export: "WidgetSlot",
    dependencies: [],
    peer_dep_ranges: peerDepRanges,
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
    target_code: "",
    loader_code: "",
    checksum: "",
  };
}

test("doctor reports 'ok' for a satisfying installed version", async () => {
  const projectRoot = freshDir("doctor-ok");
  installDependency(projectRoot, "react", "18.3.1");
  const report = await runDoctor(fakeEntry({ react: ">=18.2.0" }), projectRoot);
  assert.equal(report.all_ok, true);
  assert.equal(report.checks[0].status, "ok");
});

test("doctor reports 'mismatch' for a below-range installed version", async () => {
  const projectRoot = freshDir("doctor-mismatch");
  installDependency(projectRoot, "next", "13.4.0");
  const report = await runDoctor(fakeEntry({ next: ">=14.0.0" }), projectRoot);
  assert.equal(report.all_ok, false);
  assert.equal(report.checks[0].status, "mismatch");
});

test("doctor reports 'missing' when the dependency is not installed", async () => {
  const projectRoot = freshDir("doctor-missing");
  const report = await runDoctor(fakeEntry({ three: ">=0.160.0" }), projectRoot);
  assert.equal(report.all_ok, false);
  assert.equal(report.checks[0].status, "missing");
  assert.equal(report.checks[0].installed_version, null);
});

test("doctor checks every peer dependency independently", async () => {
  const projectRoot = freshDir("doctor-multi");
  installDependency(projectRoot, "react", "18.3.1");
  installDependency(projectRoot, "next", "13.0.0");
  const report = await runDoctor(
    fakeEntry({ react: ">=18.2.0", next: ">=14.0.0" }),
    projectRoot,
  );
  assert.equal(report.checks.length, 2);
  assert.equal(report.all_ok, false);
  const byDep = Object.fromEntries(report.checks.map((c) => [c.dependency, c.status]));
  assert.equal(byDep.react, "ok");
  assert.equal(byDep.next, "mismatch");
});
