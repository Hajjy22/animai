// The static vetting logic, extracted so it can run against ANY component
// source — the registry harness (scripts/vet.mjs) and, in the future, an
// `animai vet <path>` command that lints code your AI agent generated.
//
// Pure and dependency-light: give it component + (optional) loader source and a
// manifest-ish object, get back the individual checks and the derived report.

import { Lang, parse } from "@ast-grep/napi";

export const HARNESS_VERSION = "0.1.0";

/**
 * Runs the static safety checks for one component. Returns the individual check
 * results plus the derived vetting_report fields.
 */
export function vetComponent({ componentSrc, loaderSrc, manifest = {} }) {
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
