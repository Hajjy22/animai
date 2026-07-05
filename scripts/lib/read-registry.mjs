// Shared registry reader used by both build-registry.mjs (emits the bundled
// src/registry.data.ts) and build-cdn.mjs (emits the deployable static CDN
// artifacts). Keeping the manifest + code assembly and — critically — the
// checksum algorithm in one place prevents the two build steps from drifting.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
export const rootDir = resolve(libDir, "..", "..");
export const registryDir = join(rootDir, "registry");

const CHECKSUM_SEPARATOR = String.fromCharCode(32); // U+0020 SPACE, spelled out to avoid encoding corruption.

const REQUIRED_FIELDS = [
  "template_id",
  "version",
  "tier",
  "title",
  "summary",
  "framework",
  "framework_targets",
  "component_filename",
  "loader_filename",
  "loader_export",
  "dependencies",
  "peer_dep_ranges",
  "integration_instructions",
  "preview_url",
  "vetting_report",
  "tags",
];

export function computeChecksum(componentCode, loaderCode) {
  return createHash("sha256")
    .update(componentCode)
    .update(CHECKSUM_SEPARATOR)
    .update(loaderCode)
    .digest("hex");
}

function fail(message) {
  console.error(`read-registry: ${message}`);
  process.exit(1);
}

function componentDirs() {
  let names;
  try {
    names = readdirSync(registryDir);
  } catch {
    fail(`registry directory not found at ${registryDir}`);
  }
  return names
    .filter((name) => {
      try {
        return statSync(join(registryDir, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

function buildEntry(id) {
  const dir = join(registryDir, id);
  const manifestPath = join(dir, "manifest.json");

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`could not read/parse ${manifestPath}: ${error.message}`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in manifest)) {
      fail(`${id}/manifest.json is missing required field "${field}"`);
    }
  }

  if (manifest.template_id !== id) {
    fail(
      `${id}/manifest.json template_id "${manifest.template_id}" does not match folder name "${id}"`,
    );
  }

  const componentCode = readFileSync(join(dir, "component.tsx"), "utf8");
  const loaderCode = readFileSync(join(dir, "loader.tsx"), "utf8");

  return {
    ...manifest,
    target_code: componentCode,
    loader_code: loaderCode,
    checksum: computeChecksum(componentCode, loaderCode),
  };
}

/** Returns every registry entry, sorted by template_id, with code + checksum. */
export function readAllEntries() {
  const ids = componentDirs();
  if (ids.length === 0) {
    fail("no component folders found in registry/");
  }
  return ids.map(buildEntry);
}

/**
 * The shape that ships inside the open-source npm package (dist/registry.data).
 * Free components keep their full source; Pro components are reduced to a locked
 * stub with no code — so the published package never contains paywalled source.
 * The licensed Worker serves the real Pro payload at runtime.
 */
export function toBundleEntry(entry) {
  if (entry.tier === "pro") {
    return { ...entry, target_code: "", loader_code: "", checksum: "", locked: true };
  }
  return entry;
}

/** The search-index shape (metadata only, no code) for one entry. */
export function toIndexRecord(entry) {
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
