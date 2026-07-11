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
const UI_CATEGORIES = new Set(["forms", "overlays", "navigation", "feedback", "recipe"]);

export function vetComponent({ componentSrc, loaderSrc, manifest = {} }) {
  const checks = [];
  const usesWebgl = /@react-three\/fiber|(^|[^.\w])three($|["'/])|<Canvas/.test(
    componentSrc,
  );
  const usesGsap = /@gsap\/react|(^|[^.\w])gsap($|["'\s.])/.test(componentSrc);

  // Client-only React features force a "use client" directive in the Next App
  // Router — this applies to every component, showcase or UI.
  const hasReactState = /\buse(State|Reducer|Effect|Ref|Memo|Callback)\s*\(/.test(componentSrc);
  const hasHandlers = /\son[A-Z]\w+\s*=/.test(componentSrc);
  const needsClient = usesWebgl || usesGsap || hasReactState || hasHandlers;

  // The a11y/design tier applies only to the everyday app-UI shelves — real
  // controls where keyboard, focus, and reduced-motion matter. The decorative
  // showcase pieces (pointer-driven hover cards, 3D scenes) are deliberately
  // exempt: forcing keyboard focus onto a non-interactive hover effect would be
  // wrong. Gated on the explicit manifest category, which the scaffolder sets.
  const isUiCategory = UI_CATEGORIES.has(manifest.category);
  const hasMotion = /transition|animation|@keyframes|\banimate-/i.test(componentSrc);
  const hasNativeFocusable = /<(button|input|select|textarea|a)\b/i.test(componentSrc);
  const hasFocusStyling = /focus-visible|focus:|:focus\b/.test(componentSrc);
  const hasClickableNonInteractive = /<(div|span|li)\b[^>]*onClick/i.test(componentSrc);
  const hasRole = /\brole\s*=/.test(componentSrc);

  const add = (id, ok, critical, msg) => checks.push({ id, ok, critical, msg });

  // A. "use client" — anything using WebGL, GSAP, React state/effects, or event
  // handlers must be a client component, or it breaks in the Next App Router.
  const hasUseClient = /^\s*["']use client["']/.test(componentSrc);
  add(
    "use-client",
    hasUseClient || !needsClient,
    needsClient,
    hasUseClient
      ? '"use client" directive present'
      : 'missing "use client" directive (uses client-only React features)',
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

  // --- Accessibility / design tier (everyday app-UI components only) ---
  // These make "good UX" a checked claim, the way the checks above make
  // "leak-free" one. Scoped to the interactive UI shelves; decorative showcase
  // pieces are exempt (see the isUiCategory note above).
  let a11yFocusOk = true;
  let a11yMotionOk = true;
  if (isUiCategory) {
    // F. Focus visibility — interactive UI must be keyboard-focusable with a
    // visible focus indicator (native focusable element, or explicit styling).
    a11yFocusOk = hasNativeFocusable || hasFocusStyling;
    add(
      "a11y-focus-visible",
      a11yFocusOk,
      true,
      a11yFocusOk
        ? "interactive elements are focusable with visible focus"
        : "no focusable control or focus-visible styling — keyboard users are stranded",
    );

    // G. Reduced motion — any animated UI must honor prefers-reduced-motion.
    a11yMotionOk = !hasMotion || /prefers-reduced-motion/.test(componentSrc);
    add(
      "a11y-reduced-motion",
      a11yMotionOk,
      true,
      a11yMotionOk
        ? "animation honors prefers-reduced-motion (or none present)"
        : "animates without a prefers-reduced-motion guard",
    );

    // H. Semantics (soft) — prefer real controls over click-handling divs.
    const semanticsOk = !hasClickableNonInteractive || hasRole;
    add(
      "a11y-semantics",
      semanticsOk,
      false,
      semanticsOk
        ? "clickable elements are semantic (or carry a role)"
        : "onClick on a div/span without a role — prefer a <button>",
    );

    // I. Labeled controls (soft) — inputs need an accessible name.
    const hasInput = /<(input|select|textarea)\b/i.test(componentSrc);
    const hasLabel = /<label\b|aria-label|aria-labelledby|htmlFor=/i.test(componentSrc);
    const labeledOk = !hasInput || hasLabel;
    add(
      "a11y-labeled-control",
      labeledOk,
      false,
      labeledOk
        ? "form controls have an accessible label"
        : "input without a <label> or aria-label — screen readers can't name it",
    );
  }

  const dispose_audit = usesWebgl ? (disposeOk ? "pass" : "fail") : "pass";
  const ssr_safe = usesWebgl ? ssrGateOk : true;
  const vram_leak = usesWebgl ? !disposeOk : false;
  const a11y = isUiCategory ? (a11yFocusOk && a11yMotionOk ? "pass" : "fail") : "n/a";

  return {
    checks,
    report: {
      dispose_audit,
      ssr_safe,
      vram_leak,
      a11y,
      fps_budget: manifest.vetting_report?.fps_budget ?? 60,
      measured_fps: null,
      method: "static",
      verified_at: new Date().toISOString(),
      harness_version: HARNESS_VERSION,
    },
  };
}
