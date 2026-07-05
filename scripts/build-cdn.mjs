#!/usr/bin/env node
// Emits the deployable static registry under cdn/ — the artifacts a CDN
// (Cloudflare Pages/R2, etc.) serves and the remote client fetches:
//
//   cdn/index.json                 all components, metadata only (browsable)
//   cdn/components/<id>.json        free: full payload (code + checksum)
//                                   pro:  locked stub (NO code) — the paid
//                                         source is never in the public files;
//                                         the licensed Worker serves it instead.
//
// A static-only deployment (no Worker yet) is therefore still correct: free
// components install, and pro components return a locked stub that the client
// turns into an "upgrade" message.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readAllEntries, rootDir, toIndexRecord } from "./lib/read-registry.mjs";

const cdnDir = join(rootDir, "cdn");
const componentsDir = join(cdnDir, "components");

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  const entries = readAllEntries();

  rmSync(cdnDir, { recursive: true, force: true });
  mkdirSync(componentsDir, { recursive: true });

  writeJson(
    join(cdnDir, "index.json"),
    entries.map(toIndexRecord),
  );

  let free = 0;
  let pro = 0;
  for (const entry of entries) {
    const file = join(componentsDir, `${entry.template_id}.json`);
    if (entry.tier === "pro") {
      // Locked stub: full metadata (vetting report, deps, instructions) so the
      // site can market the component, but explicitly no source code.
      const { target_code, loader_code, checksum, ...meta } = entry;
      void target_code;
      void loader_code;
      void checksum;
      writeJson(file, { ...meta, locked: true });
      pro += 1;
    } else {
      writeJson(file, entry);
      free += 1;
    }
  }

  console.error(
    `build-cdn: wrote cdn/index.json (${entries.length}) + ${free} free payload(s), ${pro} locked pro stub(s)`,
  );
}

main();
