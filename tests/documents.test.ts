import assert from "node:assert/strict";
import test from "node:test";

import {
  isSafeIncomingFilename,
  resolveIncomingDocumentPath,
} from "../src/lib/import/documents";

test("incoming document path validation accepts a plain filename", () => {
  assert.equal(isSafeIncomingFilename("reservation.pdf"), true);
  assert.match(
    resolveIncomingDocumentPath("reservation.pdf") ?? "",
    /travel-data[\\/]incoming[\\/]reservation\.pdf$/,
  );
});

test("incoming document path validation rejects traversal and hidden paths", () => {
  const unsafeNames = [
    "../reservation.pdf",
    "nested/reservation.pdf",
    "nested\\reservation.pdf",
    "/tmp/reservation.pdf",
    ".hidden.pdf",
    "reservation.pdf\0.txt",
    "",
  ];

  for (const filename of unsafeNames) {
    assert.equal(isSafeIncomingFilename(filename), false, filename);
    assert.equal(resolveIncomingDocumentPath(filename), null, filename);
  }
});
