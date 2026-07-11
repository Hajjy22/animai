#!/usr/bin/env node
// Tier 1 vetting harness: static AST analysis of every registry component
// against the AnimAI safety invariants (see .cursorrules). Enforces that each
// component disposes its GPU resources, gates WebGL behind SSR-safe loaders,
// and follows the GSAP/React rules — then writes the verdict into each
// manifest's `vetting_report`.
//
// This is the deterministic, dependency-light tier: it needs no browser and no
// React/three install, so it runs in CI on any machine. The runtime tier
// (browser mount/unmount x50 + renderer.info) fills in `measured_fps` and is
// documented in docs/vetting.md.
//
// Flags:
//   (none)     Analyze and write updated vetting_report into each manifest.
//   --check    Analyze only; do not write. Exit non-zero if any critical check
//              fails. Use this in CI.

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { vetComponent } from "./lib/vet-core.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const registryDir = join(rootDir, "registry");
const checkOnly = process.argv.includes("--check");

function componentDirs() {
  return readdirSync(registryDir)
    .filter((name) => {
      try {
        return statSync(join(registryDir, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

function readOptional(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function main() {
  const ids = componentDirs();
  let failed = 0;

  for (const id of ids) {
    const dir = join(registryDir, id);
    const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
    const componentSrc = readFileSync(join(dir, "component.tsx"), "utf8");
    const loaderSrc = readOptional(join(dir, "loader.tsx"));

    const { checks, report } = vetComponent({ componentSrc, loaderSrc, manifest });
    const criticalFails = checks.filter((c) => c.critical && !c.ok);
    const status = criticalFails.length === 0 ? "PASS" : "FAIL";
    if (criticalFails.length > 0) failed += 1;

    console.error(`\n${status}  ${id}  (v${manifest.version})`);
    for (const check of checks) {
      const mark = check.ok ? "  ok " : check.critical ? " FAIL" : " warn";
      console.error(`   [${mark}] ${check.id}: ${check.msg}`);
    }

    if (!checkOnly) {
      manifest.vetting_report = report;
      writeFileSync(
        join(dir, "manifest.json"),
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8",
      );
    }
  }

  console.error(
    `\nvet: ${ids.length} component(s), ${failed} failing critical checks` +
      (checkOnly ? " (check-only, no writes)" : " (reports written to manifests)"),
  );

  if (checkOnly && failed > 0) {
    process.exit(1);
  }
}

main();
