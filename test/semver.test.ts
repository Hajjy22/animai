import assert from "node:assert/strict";
import { test } from "node:test";
import { parseVersion, satisfiesRange } from "../dist/semver.js";

test("parseVersion extracts major.minor.patch, ignoring a leading operator/prefix", () => {
  assert.deepEqual(parseVersion("1.2.3"), { major: 1, minor: 2, patch: 3 });
  assert.deepEqual(parseVersion("v1.2.3"), { major: 1, minor: 2, patch: 3 });
  assert.deepEqual(parseVersion(">=18.2.0"), { major: 18, minor: 2, patch: 0 });
});

test("parseVersion returns null for unparsable input", () => {
  assert.equal(parseVersion("not-a-version"), null);
  assert.equal(parseVersion(""), null);
});

test("satisfiesRange: >= operator", () => {
  assert.equal(satisfiesRange("18.3.1", ">=18.2.0"), true);
  assert.equal(satisfiesRange("18.2.0", ">=18.2.0"), true);
  assert.equal(satisfiesRange("18.1.0", ">=18.2.0"), false);
  assert.equal(satisfiesRange("13.4.0", ">=14.0.0"), false);
});

test("satisfiesRange: bare version defaults to exact match", () => {
  assert.equal(satisfiesRange("1.2.3", "1.2.3"), true);
  assert.equal(satisfiesRange("1.2.4", "1.2.3"), false);
});

test("satisfiesRange: caret (^) respects major-version compatibility", () => {
  assert.equal(satisfiesRange("1.5.0", "^1.2.0"), true);
  assert.equal(satisfiesRange("2.0.0", "^1.2.0"), false);
  assert.equal(satisfiesRange("1.1.0", "^1.2.0"), false);
});

test("satisfiesRange: tilde (~) allows patch-level changes only", () => {
  assert.equal(satisfiesRange("1.2.9", "~1.2.0"), true);
  assert.equal(satisfiesRange("1.3.0", "~1.2.0"), false);
});

test("satisfiesRange returns null when either side fails to parse", () => {
  assert.equal(satisfiesRange("not-a-version", ">=1.0.0"), null);
  assert.equal(satisfiesRange("1.0.0", ">=not-a-version"), null);
});
