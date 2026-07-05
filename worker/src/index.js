import { Hono } from "hono";
import { ENTRIES } from "./data.js";
import { createValidator } from "./validator.js";

// data.js is generated (npm run build:data) and contains the FULL registry,
// including Pro source. It ships only inside the deployed Worker — never to a
// public CDN or the npm package — and Pro payloads are released only after a
// license check.
const BY_ID = new Map(ENTRIES.map((entry) => [entry.template_id, entry]));

function toIndexRecord(entry) {
  return {
    template_id: entry.template_id,
    title: entry.title,
    summary: entry.summary,
    framework: entry.framework,
    tier: entry.tier,
    tags: entry.tags,
    add_command: `npx animai add ${entry.template_id}`,
  };
}

function lockedStub(entry) {
  const { target_code, loader_code, checksum, ...meta } = entry;
  void target_code;
  void loader_code;
  void checksum;
  return { ...meta, locked: true };
}

function bearerToken(request) {
  const auth = request.header("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

const app = new Hono();

// The registry is consumed by CLIs, agents, and browsers (animai.dev). GETs
// are safe to expose cross-origin; the license check still gates Pro payloads.
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("Access-Control-Allow-Origin", "*");
  c.res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
});
app.options("*", (c) => c.body(null, 204));

app.get("/index.json", (c) => c.json(ENTRIES.map(toIndexRecord)));

app.get("/components/:file", async (c) => {
  const id = c.req.param("file").replace(/\.json$/, "");
  const entry = BY_ID.get(id);
  if (!entry) {
    return c.json({ error: "not_found" }, 404);
  }

  // Free components are public.
  if (entry.tier !== "pro") {
    return c.json(entry);
  }

  // Pro components require a valid license.
  const key = bearerToken(c.req);
  const ok = key ? await createValidator(c.env).validate(key) : false;
  if (!ok) {
    // 403 so the client raises `upgrade_required`; the body is the locked stub
    // for any non-CLI consumer.
    return c.json(lockedStub(entry), 403);
  }
  return c.json(entry);
});

app.get("/", (c) => c.text("AnimAI registry Worker"));

export default app;
