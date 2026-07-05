# AnimAI licensed registry Worker

A Cloudflare Worker (Hono) that serves the registry and gates Pro components
behind a Polar license check. It is the trusted server that holds the full Pro
source — that source is never in the public npm package or the static CDN.

## Routes

- `GET /index.json` — all components, metadata only (browsable).
- `GET /components/<id>.json`
  - Free component → full payload (public).
  - Pro component → requires `Authorization: Bearer <license-key>`. Valid →
    full payload; missing/invalid → `403` with a locked stub. The CLI/MCP client
    maps that to an "upgrade" prompt.

## License validation

`src/validator.js` picks a strategy from the environment:

- **Polar** (production) — `POST {POLAR_BASE_URL}/v1/license-keys/validate` with
  `Authorization: Bearer <POLAR_ORG_TOKEN>` and body
  `{ key, organization_id: POLAR_ORG_ID }`. Valid when the response is `200` and
  `status === "granted"`.
- **Allowlist** (local/CI) — when no `POLAR_ORG_TOKEN` is set, validates against
  `ANIMAI_TEST_KEYS` (comma-separated). Lets you exercise the whole flow with no
  Polar account.

Both are wrapped by a KV cache (`LICENSE_CACHE`), 24h for valid keys and 5min for
invalid ones, so the rate-limited Polar endpoint is not hit on every request.

## Deploy

```bash
npm install
wrangler kv namespace create LICENSE_CACHE   # paste id into wrangler.toml
# set POLAR_ORG_ID in wrangler.toml [vars]
wrangler secret put POLAR_ORG_TOKEN          # Polar org token, scope license_keys:write
npm run deploy                               # runs build:data, then wrangler deploy
```

Point the CLI/MCP at it with `ANIMAI_REGISTRY_URL=https://<your-worker-url>`.

## Local verification (no Cloudflare / Polar)

```bash
# Allowlist mode
ANIMAI_TEST_KEYS=GOLD-KEY npm run dev:node      # http://127.0.0.1:8790

# In another shell, drive the real CLI:
ANIMAI_REGISTRY_URL=http://127.0.0.1:8790 ANIMAI_LICENSE_KEY=GOLD-KEY \
  node ../dist/index.js fetch particle-field-bg
```

`node-server.mjs` runs the exact Worker app under Node via `@hono/node-server`,
with an in-memory KV shim — the same code path Wrangler deploys.

## Data

`npm run build:data` regenerates `src/data.js` from `../registry/` with **full**
source (including Pro). It is gitignored and bundled into the deployed Worker
only. The public npm bundle and CDN use the stripped variants instead.
