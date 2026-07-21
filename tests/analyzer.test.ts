import assert from "node:assert/strict";
import test from "node:test";

import { createSha256Fingerprint } from "../src/lib/import/analyzer/fingerprint";
import {
  createTextSample,
  normalizeText,
} from "../src/lib/import/analyzer/metadata";

test("SHA-256 fingerprinting is deterministic lowercase hexadecimal", () => {
  const contents = new TextEncoder().encode("synthetic reservation data");
  const first = createSha256Fingerprint(contents);
  const second = createSha256Fingerprint(contents);

  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("text normalization collapses whitespace", () => {
  assert.equal(
    normalizeText("  Flight\n\n details\t for   classification  "),
    "Flight details for classification",
  );
});

test("text samples are truncated at the configured boundary", () => {
  const sample = createTextSample("one   two three four", 13);

  assert.equal(sample.sample, "one two three");
  assert.equal(sample.characterCount, 13);
  assert.equal(sample.truncated, true);
  assert.equal(sample.status, "extracted");
});

test("blank text is treated as an image-only PDF", () => {
  const sample = createTextSample(" \n\t ");

  assert.equal(sample.sample, "");
  assert.equal(sample.status, "image-only");
  assert.equal(sample.truncated, false);
});
