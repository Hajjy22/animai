import assert from "node:assert/strict";
import { test } from "node:test";
import { vetComponent } from "../scripts/lib/vet-core.mjs";

// A harness that cannot fail is worthless (see docs/vetting.md). These tests
// pin the accessibility/design tier against deliberately-broken fixtures so a
// regression that silently stops enforcing a11y is caught immediately.

function criticalFailures(componentSrc: string, opts: { loaderSrc?: string; manifest?: unknown } = {}) {
  const { checks } = vetComponent({
    componentSrc,
    loaderSrc: opts.loaderSrc ?? null,
    manifest: opts.manifest ?? {},
  });
  return checks.filter((c: { critical: boolean; ok: boolean }) => c.critical && !c.ok).map((c: { id: string }) => c.id);
}

const CLEAN_FORM = `"use client";
import { useState } from "react";
export default function Field() {
  const [on, setOn] = useState(false);
  return (
    <button type="button" onClick={() => setOn(!on)} className="clean-btn focus-visible:outline">
      {on ? "On" : "Off"}
      <style>{\`.clean-btn { transition: color 200ms } @media (prefers-reduced-motion: reduce) { .clean-btn { transition: none } }\`}</style>
    </button>
  );
}`;

const BROKEN_FORM = `import { useState } from "react";
export default function Field() {
  const [on, setOn] = useState(false);
  return <div onClick={() => setOn(!on)} className="animate-pulse">{on ? "On" : "Off"}</div>;
}`;

const DECORATIVE_SHOWCASE = `export default function Deco() {
  return <div className="animate-pulse" />;
}`;

test("clean forms component passes the a11y tier", () => {
  const { checks, report } = vetComponent({
    componentSrc: CLEAN_FORM,
    loaderSrc: null,
    manifest: { category: "forms" },
  });
  const fails = checks.filter((c: { critical: boolean; ok: boolean }) => c.critical && !c.ok);
  assert.equal(fails.length, 0, `expected no critical failures, got ${fails.map((c: { id: string }) => c.id).join(", ")}`);
  assert.equal(report.a11y, "pass");
});

test("broken forms component fails use-client + focus + reduced-motion", () => {
  const fails = criticalFailures(BROKEN_FORM, { manifest: { category: "forms" } });
  assert.ok(fails.includes("use-client"), "missing use client should fail");
  assert.ok(fails.includes("a11y-focus-visible"), "unfocusable interactive div should fail");
  assert.ok(fails.includes("a11y-reduced-motion"), "unguarded animation should fail");
});

test("broken forms component reports a11y: fail", () => {
  const { report } = vetComponent({
    componentSrc: BROKEN_FORM,
    loaderSrc: null,
    manifest: { category: "forms" },
  });
  assert.equal(report.a11y, "fail");
});

test("decorative showcase piece is exempt from the a11y tier", () => {
  const { checks, report } = vetComponent({
    componentSrc: DECORATIVE_SHOWCASE,
    loaderSrc: null,
    manifest: { category: "showcase" },
  });
  const a11yChecks = checks.filter((c: { id: string }) => c.id.startsWith("a11y-"));
  assert.equal(a11yChecks.length, 0, "showcase pieces must not run a11y checks");
  const fails = checks.filter((c: { critical: boolean; ok: boolean }) => c.critical && !c.ok);
  assert.equal(fails.length, 0);
  assert.equal(report.a11y, "n/a");
});
