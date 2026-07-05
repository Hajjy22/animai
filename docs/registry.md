# Registry: bundle, CDN, and the free/Pro boundary

AnimAI has one source of truth — the files under `registry/<id>/` — and three
consumers, each produced by a build step. The **Pro boundary is enforced in
every generated artifact**: neither the published npm package nor the public CDN
ever contains Pro source code.

## Source of truth

```
registry/<id>/
  manifest.json     metadata (tier, version, peer_dep_ranges, vetting_report, ...)
  component.tsx     the component source
  loader.tsx        the SSR-safe loader
```

`scripts/lib/read-registry.mjs` is the single reader (and the single home of the
checksum algorithm) used by both build steps below.

## 1. Bundled runtime data — `npm run build:registry`

Emits `src/registry.data.ts` (compiled into `dist/`, shipped in the npm
package). Free components are inlined with full code. **Pro components are
reduced to a locked stub** (`locked: true`, empty code) by `toBundleEntry`, so
`npm install animai` never ships paywalled source. The local/offline source
throws `upgrade_required` for locked entries.

## 2. Static CDN — `npm run build:cdn`

Emits `cdn/` for upload to a CDN (Cloudflare Pages/R2, etc.):

```
cdn/index.json              all components, metadata only (browsable/searchable)
cdn/components/<id>.json     free: full payload; pro: locked stub (no code)
```

A static-only deployment (before the Worker exists) is already correct: free
components install; Pro components return a locked stub that the client turns
into an upgrade prompt.

## 3. Licensed Worker (Phase 2)

For Pro components the client sends `Authorization: Bearer <license-key>`
(`animai login` / `ANIMAI_LICENSE_KEY`). The Worker validates the key (Polar)
and serves the **full** Pro payload; without a valid key it returns the locked
stub or a 401/402/403. Either way the client raises `upgrade_required` with the
pricing URL. A full payload (`tier: "pro"` *with* code) passes through — that is
the paying-customer path.

## Client resolution order

`createRegistrySource` (src/registry-client.ts): no registry URL configured →
bundled local only (zero network). URL configured → remote-first with a 24h disk
cache and local-bundle fallback, so a flaky CDN never breaks `add`. A definitive
`upgrade_required` is never swallowed by the fallback.

## Note on Pro source in this repo

`registry/particle-field-bg/` demonstrates the Pro tier end-to-end. In a real
deployment, Pro component *source* lives in a private registry (separate repo or
private path) so it is not public; only free components and the tooling live in
the open-source repo. The build steps and client already enforce the boundary
regardless of where the source is read from.
