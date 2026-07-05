import assert from "node:assert/strict";
import { test } from "node:test";
import { computeChecksum } from "../dist/checksum.js";

test("computeChecksum is deterministic for the same inputs", () => {
  const a = computeChecksum("const x = 1;", "const y = 2;");
  const b = computeChecksum("const x = 1;", "const y = 2;");
  assert.equal(a, b);
});

test("computeChecksum changes when either input changes", () => {
  const base = computeChecksum("const x = 1;", "const y = 2;");
  assert.notEqual(computeChecksum("const x = 2;", "const y = 2;"), base);
  assert.notEqual(computeChecksum("const x = 1;", "const y = 3;"), base);
});

test("computeChecksum distinguishes concatenation boundaries (not just string concat)", () => {
  // Guards against a naive `a + b` hash that can't tell "ab" + "c" from "a" + "bc".
  assert.notEqual(computeChecksum("ab", "c"), computeChecksum("a", "bc"));
});

test("computeChecksum produces a 64-character lowercase hex sha256 digest", () => {
  const digest = computeChecksum("x", "y");
  assert.equal(digest.length, 64);
  assert.match(digest, /^[0-9a-f]{64}$/);
});
