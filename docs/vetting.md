# Vetting harness

Every component in `registry/` ships a `vetting_report` in its `manifest.json`.
The report is the product's core claim — that AnimAI components are
leak-free, SSR-safe, and performance-budgeted — so it is produced by tooling,
not written by hand. There are two tiers.

## Tier 1 — static analysis (implemented)

`scripts/vet.mjs` parses each component's source with `@ast-grep/napi` and
enforces the safety invariants from `.cursorrules`:

| Check | Critical | What it verifies |
|---|---|---|
| `use-client` | for WebGL | `"use client"` directive is present |
| `dispose-cleanup` | yes | a `useEffect` returns a cleanup that calls `.dispose()` (no VRAM leak) |
| `ssr-gate` | yes | the loader lazy-loads the component with `next/dynamic { ssr: false }` |
| `canvas-sizing` | warn | `<Canvas>` has an explicitly sized parent |
| `gsap-usegsap` | yes (GSAP only) | GSAP animations use the `useGSAP()` hook, not a bare `useEffect` |

Run it:

```bash
npm run vet         # analyze and write vetting_report into each manifest
npm run vet:check   # analyze only; exit non-zero if any critical check fails (CI gate)
```

Tier 1 runs anywhere — no browser, no React/three install — so it belongs in
CI on every pull request. It sets `method: "static"` and leaves
`measured_fps: null`, because it cannot measure runtime FPS or confirm the leak
verdict on a real GPU. The `dispose_audit`, `ssr_safe`, and `vram_leak` fields
are the static inference: `vram_leak` is `true` when a component creates GPU
resources but has no dispose cleanup.

The harness is verified against a deliberately-broken fixture (a component with
no dispose cleanup and a loader that skips the SSR gate); it must flag both and
exit non-zero. Keep that negative test in mind when changing the checks: a
harness that cannot fail is worthless.

## Tier 2 — runtime measurement (planned)

The runtime tier confirms the static verdict on a real WebGL context and fills
in `measured_fps`. Planned shape:

- A separate `harness/` workspace with its own `package.json` (React, three,
  `@react-three/fiber`, Playwright) so the CLI package stays dependency-light.
- A Vite/Next workbench page that imports a component + loader and exposes a
  `window.__harness` API to mount, unmount, and read `renderer.info`.
- A Playwright driver (headless Chromium with WebGL) that:
  1. mounts the component, records baseline `renderer.info.memory.geometries`,
     `renderer.info.memory.textures`, and `renderer.info.programs.length`;
  2. unmounts and remounts 50×, asserting the counters return to baseline
     (monotonic growth = a real leak, which fails the run);
  3. measures frame time via `requestAnimationFrame` to produce `measured_fps`.

When Tier 2 runs alongside Tier 1, the report method becomes `static+runtime`.

## Known GPU-compatibility risk: avoid `MeshTransmissionMaterial` + `Environment`

While building the v2 flagship components (Phase A), drei's
`MeshTransmissionMaterial` combined with `<Environment>` reliably triggered
`THREE.WebGLRenderer: Context Lost` in a constrained/software-rendered GPU
sandbox — reduced `resolution`/`samples` did not fix it, only removing the
combination did. `MeshTransmissionMaterial`'s render-to-texture technique is
one of the heaviest in the R3F/drei ecosystem and is known in the community to
be driver-sensitive.

Given AnimAI's core promise is "performance-budgeted and safe," **do not use
`MeshTransmissionMaterial` (with or without `Environment`) in any component**
until Tier 2 gives us an automated way to catch this class of failure across a
range of GPU backends. Prefer emissive `MeshStandardMaterial` + `Bloom`
(`@react-three/postprocessing`) for a premium "glowing" look — verified stable
and visually strong (see `registry/hero-orbital-rig`). If a future component
genuinely needs transmission/glass, test it manually across several
GPU/driver combinations (including software rendering) before shipping it,
and note the result here.
