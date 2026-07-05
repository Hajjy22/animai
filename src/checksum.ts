import { createHash } from "node:crypto";

/** Must match CHECKSUM_SEPARATOR / the algorithm in scripts/build-registry.mjs exactly. */
const CHECKSUM_SEPARATOR = String.fromCharCode(32); // U+0020 SPACE, spelled out to avoid encoding corruption.

export function computeChecksum(componentCode: string, loaderCode: string): string {
  return createHash("sha256")
    .update(componentCode)
    .update(CHECKSUM_SEPARATOR)
    .update(loaderCode)
    .digest("hex");
}
