import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  approveReservation,
  loadApprovedReservations,
  reservationFilename,
} from "../src/lib/import/persistence/reservations";
import { validHotel } from "./helpers";

test("reservation filenames are stable and filesystem safe", () => {
  const fingerprint = "d".repeat(64);
  assert.equal(
    reservationFilename(fingerprint),
    `reservation-${"d".repeat(24)}.json`,
  );
  assert.throws(() => reservationFilename("../unsafe"));
});

test("approval writes atomically and duplicate fingerprints update one record", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bt023-persistence-"));
  try {
    const original = validHotel();
    const created = await approveReservation(
      original,
      new Date("2030-01-01T00:00:00.000Z"),
      directory,
    );
    const updatedDraft = validHotel();
    updatedDraft.hotel.propertyName = "Updated Example Hotel";
    const updated = await approveReservation(
      updatedDraft,
      new Date("2030-01-02T00:00:00.000Z"),
      directory,
    );
    const entries = await readdir(directory);

    assert.equal(created.updated, false);
    assert.equal(updated.updated, true);
    assert.equal(updated.reservation.createdAt, created.reservation.createdAt);
    assert.equal(updated.reservation.modifiedAt, "2030-01-02T00:00:00.000Z");
    assert.deepEqual(entries, [reservationFilename(original.documentFingerprint)]);
    assert.doesNotMatch(entries.join(" "), /\.tmp|\.lock/);
    const persisted = await readFile(join(directory, entries[0]), "utf8");
    assert.doesNotThrow(() => JSON.parse(persisted));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("reservation loading skips malformed JSON", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bt023-loading-"));
  try {
    await approveReservation(validHotel(), new Date("2030-01-01T00:00:00Z"), directory);
    await writeFile(
      join(directory, `reservation-${"e".repeat(24)}.json`),
      "{malformed",
    );
    const loaded = await loadApprovedReservations(directory);

    assert.equal(loaded.reservations.length, 1);
    assert.deepEqual(loaded.malformedFiles, [
      `reservation-${"e".repeat(24)}.json`,
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("concurrent repeated approvals retain one complete JSON record", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bt023-concurrent-"));
  try {
    await Promise.all([
      approveReservation(validHotel(), new Date("2030-01-01T00:00:00Z"), directory),
      approveReservation(validHotel(), new Date("2030-01-01T00:00:01Z"), directory),
    ]);
    const entries = await readdir(directory);
    assert.equal(entries.length, 1);
    const persisted = await readFile(join(directory, entries[0]), "utf8");
    assert.doesNotThrow(() => JSON.parse(persisted));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
