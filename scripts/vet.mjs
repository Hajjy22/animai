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
import { Lang, parse } from "@ast-grep/napi";

const HARNESS_VERSION = "0.1.0";

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

/**
 * Runs the static checks for one component. Returns the individual check
 * results plus the derived vetting_report fields.
 */
function vetComponent({ componentSrc, loaderSrc, manifest }) {
  const checks = [];
  const usesWebgl = /@react-three\/fiber|(^|[^.\w])three($|["'/])|<Canvas/.test(
    componentSrc,
  );
  const usesGsap = /@gsap\/react|(^|[^.\w])gsap($|["'\s.])/.test(componentSrc);

  const add = (id, ok, critical, msg) => checks.push({ id, ok, critical, msg });

  // A. "use client" — anything touching WebGL/window must be a client component.
  const hasUseClient = /^\s*["']use client["']/.test(componentSrc);
  add(
    "use-client",
    hasUseClient || !usesWebgl,
    usesWebgl,
    hasUseClient ? '"use client" directive present' : 'missing "use client" directive',
  );

  // B. Dispose cleanup — a useEffect must return a cleanup that calls .dispose().
  let disposeOk = true;
  if (usesWebgl) {
    const root = parse(Lang.Tsx, componentSrc).root();
    const effects = root.findAll({ rule: { pattern: "useEffect($$$ARGS)" } });
    disposeOk = effects.some((effect) => {
      const text = effect.text();
      const returnsCleanup =
        /return\s*\(\s*\)\s*=>/.test(text) ||
        /return\s+function\b/.test(text) ||
        /return\s+\w+\s*=>/.test(text);
      return returnsCleanup && /\.dispose\s*\(/.test(text);
    });
    add(
      "dispose-cleanup",
      disposeOk,
      true,
      disposeOk
        ? "useEffect returns a cleanup that disposes GPU resources"
        : "no useEffect cleanup calling .dispose() — likely VRAM leak",
    );
  }

  // C. SSR gate — the loader must lazy-load the WebGL component with ssr:false.
  let ssrGateOk = true;
  if (usesWebgl) {
    if (loaderSrc == null) {
      ssrGateOk = false;
      add("ssr-gate", false, true, "no loader file to gate SSR");
    } else {
      const usesDynamic = /next\/dynamic/.test(loaderSrc);
      const ssrFalse = /ssr\s*:\s*false/.test(loaderSrc);
      ssrGateOk = usesDynamic && ssrFalse;
      add(
        "ssr-gate",
        ssrGateOk,
        true,
        ssrGateOk
          ? "loader gates WebGL with next/dynamic { ssr: false }"
          : "loader missing next/dynamic { ssr: false } — WebGL will crash SSR",
      );
    }
  }

  // D. Canvas sizing (soft) — <Canvas> needs an explicitly sized parent.
  if (/<Canvas/.test(componentSrc)) {
    const sized = /h-screen|h-full|min-h-screen|h-\[|height\s*:/.test(componentSrc);
    add(
      "canvas-sizing",
      sized,
      false,
      sized
        ? "Canvas has an explicitly sized container"
        : "Canvas parent may lack explicit dimensions",
    );
  }

  // E. GSAP rule — GSAP animations must use the useGSAP() hook, not bare useEffect.
  if (usesGsap) {
    const usesUseGsap = /useGSAP/.test(componentSrc);
    add(
      "gsap-usegsap",
      usesUseGsap,
      true,
      usesUseGsap
        ? "GSAP animations use useGSAP()"
        : "GSAP used without useGSAP() — timelines will leak in Strict Mode",
    );
  }

  const dispose_audit = usesWebgl ? (disposeOk ? "pass" : "fail") : "pass";
  const ssr_safe = usesWebgl ? ssrGateOk : true;
  const vram_leak = usesWebgl ? !disposeOk : false;

  return {
    checks,
    report: {
      dispose_audit,
      ssr_safe,
      vram_leak,
      fps_budget: manifest.vetting_report?.fps_budget ?? 60,
      measured_fps: null,
      method: "static",
      verified_at: new Date().toISOString(),
      harness_version: HARNESS_VERSION,
    },
  };
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
