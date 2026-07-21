import assert from "node:assert/strict";
import test from "node:test";

import {
  mapApprovedReservationsToLogistics,
  mergeImportedLogistics,
} from "../src/lib/import/logistics";
import type {
  ApprovedReservation,
  NormalizedReservation,
} from "../src/lib/import/reservation";
import type { TripLogistics } from "../src/types/logistics";
import { validFlight, validHotel, validRentalCar } from "./helpers";

function approved(reservation: NormalizedReservation): ApprovedReservation {
  return {
    ...reservation,
    status: "approved",
    approvedAt: "2030-01-01T00:00:00.000Z",
    createdAt: "2030-01-01T00:00:00.000Z",
    modifiedAt: "2030-01-01T00:00:00.000Z",
  } as ApprovedReservation;
}

test("approved reservations map to dated logistics entries", () => {
  const mapped = mapApprovedReservationsToLogistics([
    approved(validFlight()),
    approved(validHotel()),
    approved(validRentalCar()),
  ]);

  assert.equal(mapped.accommodations.length, 1);
  assert.equal(mapped.reservations.length, 5);
  assert.ok(mapped.reservations.every((entry) => entry.source === "imported"));
  assert.ok(
    mapped.reservations.some(
      (entry) => entry.id.endsWith("-pickup") && entry.date === "2030-07-10",
    ),
  );
  assert.ok(
    mapped.reservations.some(
      (entry) => entry.id.endsWith("-dropoff") && entry.date === "2030-07-12",
    ),
  );
});

test("imported logistics preserve manual itinerary content", () => {
  const manual: TripLogistics = {
    accommodations: [],
    reservations: [
      {
        id: "manual-entry",
        type: "attraction",
        title: "Manual plan",
        status: "planned",
        source: "manual",
      },
    ],
    documents: [],
    checklist: [],
    emergencyNotes: [],
  };
  const merged = mergeImportedLogistics(manual, [approved(validFlight())]);

  assert.equal(merged.reservations[0].id, "manual-entry");
  assert.equal(merged.reservations[1].source, "imported");
  assert.deepEqual(merged.documents, manual.documents);
});
