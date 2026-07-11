# AnimAI Launch Checklist

## Pre-launch

- [ ] `npm run vet:check` — all 9 components pass
- [ ] `npm test` — 43 tests green
- [ ] `cd web && npm run build` — production build clean
- [ ] Pricing page live at `/pricing`
- [ ] Waitlist form created (Tally) and linked from `/pricing` CTA
- [ ] OG image renders correctly (test with https://opengraph.xyz)
- [ ] Favicon shows in browser tab

## npm publish

```bash
npm login          # interactive — you must authenticate
npm publish        # prepublishOnly runs build + vet + test
npx animai@latest  # verify the published CLI works
```

## Cloudflare Worker deploy

```bash
cd worker
wrangler kv namespace create LICENSE_CACHE
# paste the namespace id into worker/wrangler.toml
npm run deploy
# verify: curl https://your-worker.workers.dev/v1/components
```

Skip Polar secrets for now — free launch only. Pro fetches return a locked
stub with an upgrade message, which is correct behavior.

## Site deploy (Vercel)

```bash
cd web
vercel --prod
# or link to GitHub and push — Vercel auto-deploys
```

Known gotcha: the playground spawns `node ../dist/index.js`. Either:
1. Add `animai` as a `file:..` dep + `outputFileTracingIncludes` in `next.config.mjs`, or
2. Switch `web/lib/mcp.ts` to spawn `npx -y animai mcp` (works once npm published)

## MCP registry submissions

Submit to all directories to maximize AI-agent discovery:

- [ ] https://github.com/modelcontextprotocol/servers — official registry PR
- [ ] https://smithery.ai — Smithery
- [ ] https://mcp.so — MCP.so directory
- [ ] https://pulsemcp.com — PulseMCP
- [ ] https://glama.ai/mcp/servers — Glama
- [ ] Cursor MCP directory (Settings → MCP → Browse)

## GitHub

- [ ] Push to public GitHub repo
- [ ] Write a clear README with: hero screenshot, `npx animai add` demo, MCP config snippet
- [ ] Add topics: `mcp`, `react-three-fiber`, `gsap`, `motion`, `components`, `cli`

## Launch channels

### Product Hunt
- Title: "AnimAI — production-safe 3D & motion your AI agent can install"
- Tagline: "shadcn for 3D. Vetted, leak-free, SSR-safe React components via CLI & MCP."

### X thread draft
1. "Just shipped AnimAI — an open-source registry of vetted 3D & motion components that your AI coding agent (Cursor, Claude Code, Windsurf) can install in one command."
2. "Every component is certified leak-free, SSR-safe, and performance-budgeted by a static+runtime vetting harness. No more GPU memory leaks in production."
3. "The MCP server gives AI agents two tools: search the library and inject components with AST-safe edits. Zero manual copy-paste."
4. "Free tier: 6 components, CLI, MCP. Pro: $59/yr founding price for the full library. Try it: `npx animai add aurora-hero`"

## Kill criteria (30 days post-launch)

| Metric | Threshold | Action if below |
|--------|-----------|-----------------|
| npm installs | < 300 | Stop investing; pivot to vetting-harness-as-product |
| GitHub stars | < 50 | Reassess distribution strategy |
| Pricing CTA click-through | < 2% | Don't build more Pro components |

If ALL metrics are below threshold → full pivot or sunset.
If installs are strong but pricing CTR is low → the components sell but the paywall doesn't. Expand free tier, find a different monetization axis.
