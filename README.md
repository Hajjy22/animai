# AnimAI

**Production-safe 3D & motion components your AI agent can install.**

AI agents are great at UI — and notoriously bad at WebGL. Ask one for a Three.js
hero and you'll usually get VRAM leaks, SSR crashes, and hydration bugs. AnimAI
fixes that with a registry of **pre-vetted React Three Fiber & GSAP components**
that are certified leak-free, SSR-safe, and performance-budgeted — then injected
into your Next.js app with **AST-safe edits** (never regex) by a CLI or an MCP
server your agent calls directly.

```bash
npx animai add hero-orbital-rig
```

## Why vetted matters

Every component ships with a machine-generated **vetting report**, produced by
the harness in [`scripts/vet.mjs`](scripts/vet.mjs) and enforced in CI:

| Check | Guarantee |
|---|---|
| Dispose audit | a `useEffect` cleanup disposes every geometry/material/texture — no VRAM leaks |
| SSR gate | WebGL is loaded via `next/dynamic { ssr: false }` — no server crashes |
| GSAP rule | animations use `useGSAP()` — timelines revert cleanly in Strict Mode |
| Canvas sizing | `<Canvas>` always gets an explicitly sized container |

## Use it from your AI agent (MCP)

Add one line to your agent's MCP config (Cursor, Claude Code, Windsurf):

```json
{
  "mcpServers": {
    "animai": { "command": "npx", "args": ["-y", "animai", "mcp"] }
  }
}
```

Your agent gets two flat, deterministic tools:

- `search_motion_library` — natural-language search over the registry
- `fetch_motion_component` — exact vetted source + dependencies + integration steps

## Use it from the CLI

```bash
npx animai search "dark 3d hero"        # find components
npx animai add hero-orbital-rig          # write files + AST-patch your route
npx animai add hero-orbital-rig --dry-run
npx animai add hero-orbital-rig --target main
npx animai doctor hero-orbital-rig       # check peer-dependency versions
npx animai update hero-orbital-rig       # re-fetch latest (guards your local edits)
npx animai login <license-key>           # unlock Pro components
```

`add` writes the component + SSR-safe loader into `app/components/` and injects
the JSX into your route using `@ast-grep/napi` Find & Patch — imports and nodes
are inserted through the AST, so your source is never corrupted by string
replacement.

## Free & Pro

The CLI, MCP server, and a growing set of components are free (MIT). Pro
components are delivered through a licensed registry — the public npm package
and CDN never contain Pro source. See [docs/registry.md](docs/registry.md).

## Repository layout

| Path | What it is |
|---|---|
| `src/` | CLI + MCP server + registry client (the `animai` npm package) |
| `registry/` | Component source of truth (`manifest.json` + code per component) |
| `scripts/` | Registry/CDN build steps + the vetting harness |
| `web/` | animai.dev — browse, docs, and a live MCP playground |
| `worker/` | Cloudflare Worker serving the licensed registry (Polar) |
| `docs/` | [vetting](docs/vetting.md) and [registry](docs/registry.md) architecture |
| `examples/next-demo` | Minimal Next.js target app for trying `add` locally |

## Develop

```bash
npm install
npm run build        # build registry data + compile TypeScript
npm run vet          # run the vetting harness, write reports
npm run vet:check    # CI gate — non-zero exit on any critical failure
npm run demo:dry-run # preview an AST injection against examples/next-demo
npm run mcp          # start the MCP server on stdio
```

## License

MIT for the tooling and free components. Pro components are licensed per the
terms at animai.dev.
