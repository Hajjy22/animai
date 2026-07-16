# AnimAI Launch Checklist

Status legend: [x] done · [ ] pending · [~] blocked on your account access

## Pre-launch

- [x] `npm run vet:check` — all 56 components pass (28 free / 28 pro), incl. the
      9-piece Signature Collection and the accessibility tier on everyday UI
- [x] `npm test` — 47 tests green
- [x] `cd web && npm run build` — production build clean
- [x] Pricing page live at `/pricing`
- [ ] Waitlist form created (Tally) and linked from `/pricing` CTA
      — replace the `tally.so/r/REPLACE_...` placeholder in web/app/pricing/page.tsx
- [ ] OG image renders correctly (test with https://opengraph.xyz)
- [x] Favicon shows in browser tab
- [x] Public GitHub repo pushed + CI green — https://github.com/Hajjy22/animai

## Domain

- [ ] Pick a domain — **`animai.dev` is taken** (checked 2026-07-11). Candidates:
      `animai.pro`, `animai.studio`, `animai.design`, `animai.cc`, or `animaico.com`.
      Until then, deploy on the free `*.vercel.app` subdomain and set
      `NEXT_PUBLIC_SITE_URL` to it (drives OG/canonical URLs).

## npm publish [~ needs your npm login]

`npm pack --dry-run` is clean (48 files, dist-only, package name `animai`).

```bash
npm login          # interactive — you must authenticate
npm publish        # prepublishOnly runs build + vet + test
npx animai@latest  # verify the published CLI works
```

## Cloudflare Worker deploy [~ needs your Cloudflare account]

```bash
cd worker
wrangler kv namespace create LICENSE_CACHE
# paste the namespace id into worker/wrangler.toml
npm run deploy
# verify: curl https://your-worker.workers.dev/v1/components
```

Skip Polar secrets for now — free launch only. Pro fetches return a locked
stub with an upgrade message, which is correct behavior. After deploy, paste
the Worker URL into `DEFAULT_REGISTRY_URL` in src/config.ts, then rebuild and
republish (npm) so the CLI/MCP default to the live registry.

## Site deploy (Vercel) [~ needs your Vercel account]

The web app imports the `animai` package via `file:..` and its `prebuild`
reads `../scripts` and `../registry`, so the build context must be the repo
root. In the Vercel project settings:

- **Root Directory:** repository root (not `web/`)
- **Framework Preset:** Next.js · **Output Directory:** `web/.next`
- **Install Command:** `npm ci && npm --prefix web ci`
- **Build Command:** `npm run build && npm --prefix web run build`
- **Env:** `NEXT_PUBLIC_SITE_URL` = the deploy URL (drives OG/canonical URLs)

The old "playground spawns a subprocess" gotcha is **resolved** — the
playground now runs in-process (see src/mcp-tools.ts + web/lib/mcp.ts), and
`outputFileTracingRoot` is set so the /api/mcp serverless bundle includes the
linked package. This same root-first build order is already green in CI.

## MCP registry submissions

Submit to all directories to maximize AI-agent discovery:

- [ ] https://github.com/modelcontextprotocol/servers — official registry PR
- [ ] https://smithery.ai — Smithery
- [ ] https://mcp.so — MCP.so directory
- [ ] https://pulsemcp.com — PulseMCP
- [ ] https://glama.ai/mcp/servers — Glama
- [ ] Cursor MCP directory (Settings → MCP → Browse)

## GitHub

- [x] Push to public GitHub repo — https://github.com/Hajjy22/animai (CI green)
- [x] README with `npx animai add` demo + MCP config snippet
- [x] Add discovery topics (mcp, model-context-protocol, react-three-fiber, threejs, gsap, motion, components, cli, nextjs, webgl)
- [ ] Add a hero screenshot/GIF to the README (capture from the running site)

## Launch channels

### Product Hunt
- Title: "AnimAI — production-safe 3D & motion your AI agent can install"
- Tagline: "shadcn for 3D. Vetted, leak-free, SSR-safe React components via CLI & MCP."

### X thread draft
1. "Just shipped AnimAI — an open-source registry of vetted 3D & motion components that your AI coding agent (Cursor, Claude Code, Windsurf) can install in one command."
2. "Every component is certified leak-free, SSR-safe, and performance-budgeted by a static+runtime vetting harness. No more GPU memory leaks in production."
3. "The MCP server gives AI agents two tools: search the library and inject components with AST-safe edits. Zero manual copy-paste."
4. "Free tier: 28 components, CLI, MCP. Pro: $59/yr founding price for all 56 — including the Signature Collection (particle text morph, liquid image hover, exploded-view scroll). Try it: `npx animai add aurora-hero`"

## Kill criteria (30 days post-launch)

| Metric | Threshold | Action if below |
|--------|-----------|-----------------|
| npm installs | < 300 | Stop investing; pivot to vetting-harness-as-product |
| GitHub stars | < 50 | Reassess distribution strategy |
| Pricing CTA click-through | < 2% | Don't build more Pro components |

If ALL metrics are below threshold → full pivot or sunset.
If installs are strong but pricing CTR is low → the components sell but the paywall doesn't. Expand free tier, find a different monetization axis.
