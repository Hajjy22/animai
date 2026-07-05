// Runs the exact Hono Worker app under Node for local verification — no
// Cloudflare or Polar account required. License validation uses the allowlist
// strategy via ANIMAI_TEST_KEYS, and KV is an in-memory shim.
//
//   ANIMAI_TEST_KEYS=GOLD-KEY node node-server.mjs

import { serve } from "@hono/node-server";
import app from "./src/index.js";

const store = new Map();
const kv = {
  async get(key) {
    return store.has(key) ? store.get(key) : null;
  },
  async put(key, value) {
    store.set(key, value);
  },
};

const env = {
  POLAR_ORG_TOKEN: process.env.POLAR_ORG_TOKEN,
  POLAR_ORG_ID: process.env.POLAR_ORG_ID,
  POLAR_BASE_URL: process.env.POLAR_BASE_URL,
  ANIMAI_TEST_KEYS: process.env.ANIMAI_TEST_KEYS,
  LICENSE_CACHE: kv,
};

const port = Number(process.env.PORT || 8790);

serve(
  { fetch: (request) => app.fetch(request, env), port },
  (info) => console.error(`animai worker (node) on http://127.0.0.1:${info.port}`),
);
