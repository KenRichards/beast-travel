import assert from "node:assert/strict";
import test from "node:test";

import audit from "../src/data/trips/switzerland-2026/audit.json";
import { getItinerary } from "../src/lib/itinerary";
import { normalizeTimeline } from "../src/lib/timeline";
import { validateTripData } from "../src/lib/trip-data-validation";
import { generateTravelPack } from "../src/lib/travel-pack";
import type { ApprovedReservation, NormalizedReservation } from "../src/lib/import/reservation";
import type { Itinerary } from "../src/types/itinerary";
import { validFlight, validHotel, validRentalCar } from "./helpers";

function cloneTrip(): Itinerary {
  return structuredClone(getItinerary());
}

function approved<T extends NormalizedReservation>(reservation: T): T & ApprovedReservation {
  return {
    ...reservation,
    status: "approved",
    approvedAt: "2030-01-01T00:00:00.000Z",
    createdAt: "2030-01-01T00:00:00.000Z",
    modifiedAt: "2030-01-01T00:00:00.000Z",
  } as T & ApprovedReservation;
}

test("Switzerland itinerary represents every date from July 22 through July 29", () => {
  assert.deepEqual(
    getItinerary().days.map((day) => day.date),
    ["2026-07-22", "2026-07-23", "2026-07-24", "2026-07-25", "2026-07-26", "2026-07-27", "2026-07-28", "2026-07-29"],
  );
});

test("Day 1 goes directly from Zürich Airport to Grindelwald with no sightseeing", () => {
  const day = getItinerary().days[0];
  assert.equal(day.operations.startLocation, "Zürich Airport arrivals");
  assert.match(day.operations.endLocation, /Grindelwald/);
  assert.ok(day.travelSegments.some((segment) => segment.from === "Zürich Airport" && /Grindelwald/.test(segment.to)));
  assert.ok(!day.schedule.some((item) => /old town|bahnhofstrasse|lindenhof|sightseeing/i.test(item.title)));
  assert.match(day.description, /no Zürich sightseeing/i);
});

test("lodging transitions cover Grindelwald through July 25 and Au beginning July 25", () => {
  const stays = getItinerary().logistics.accommodations;
  const grindelwald = stays.find((stay) => stay.city === "Grindelwald");
  const au = stays.find((stay) => stay.city === "Au");
  assert.equal(grindelwald?.checkInDate, "2026-07-22");
  assert.equal(grindelwald?.checkOutDate, "2026-07-25");
  assert.equal(au?.checkInDate, "2026-07-25");
  assert.equal(au?.checkOutDate, "2026-07-29");
});

test("every day has meaningful content, operational details, provenance, and fallback", () => {
  for (const day of getItinerary().days) {
    assert.ok(day.schedule.length >= 6, `Day ${day.day} schedule`);
    assert.ok(day.operations.fallbackPlan.length > 20, `Day ${day.day} fallback`);
    assert.ok(day.operations.parking.length > 0, `Day ${day.day} parking`);
    assert.ok(day.operations.meals.length > 0, `Day ${day.day} meals`);
    assert.ok([...day.locations, ...day.schedule, ...day.travelSegments].every((item) => Boolean(item.sourceStatus)));
  }
});

test("transfer day stays bounded and does not add a mountain excursion", () => {
  const day = getItinerary().days[3];
  assert.ok(day.schedule.length <= 8);
  assert.ok(!day.schedule.some((item) => /jungfrau|pilatus|rigi|mountain excursion/i.test(`${item.title} ${item.description}`)));
});

test("confirmed and recommended items remain distinguishable", () => {
  const items = getItinerary().days.flatMap((day) => [...day.locations, ...day.schedule, ...day.travelSegments]);
  assert.ok(items.some((item) => item.sourceStatus === "Confirmed reservation"));
  assert.ok(items.some((item) => item.sourceStatus === "Recommended"));
  assert.ok(items.some((item) => item.sourceStatus === "Optional"));
  assert.ok(items.filter((item) => item.sourceStatus === "Confirmed reservation").every((item) => "reservationReference" in item && Boolean(item.reservationReference)));
});

test("departure-day confirmed times and conflict are reservation-grounded", () => {
  const day = getItinerary().days[7];
  assert.equal(day.schedule.find((item) => item.id === "depart-zrh")?.time, "13:25");
  assert.equal(day.schedule.find((item) => item.id === "reserved-car-return")?.time, "12:00");
  assert.equal(day.schedule.find((item) => item.id === "reserved-car-return")?.sourceStatus, "Confirmed reservation");
  assert.ok(audit.unresolvedFields.some((entry) => entry.field === "Earlier rental-car return"));
});

test("timeline ordering follows the corrected itinerary", () => {
  const events = normalizeTimeline(getItinerary());
  const arrivalDay = events.filter((event) => event.date === "2026-07-22");
  assert.ok(arrivalDay.findIndex((event) => event.title.includes("AC 880")) < arrivalDay.findIndex((event) => event.title.includes("reserved Budget")));
  assert.ok(arrivalDay.some((event) => /Zürich Airport → Eigerhome/.test(event.title)));
});

test("Travel Pack reflects all days and the corrected lodging transition", () => {
  const pack = generateTravelPack(getItinerary(), [], new Date("2026-07-25T12:00:00Z"));
  assert.equal(pack.itineraryDays.length, 8);
  assert.deepEqual(pack.lodgings.map((stay) => [stay.city, stay.checkInDate, stay.checkOutDate]), [
    ["Grindelwald", "2026-07-22", "2026-07-25"],
    ["Au", "2026-07-25", "2026-07-29"],
  ]);
  assert.equal(pack.currentHotel?.city, "Au");
});

test("trip validator accepts the corrected tracked itinerary", () => {
  const result = validateTripData(getItinerary());
  assert.deepEqual(result.errors, []);
});

test("trip validator identifies day gaps, lodging overlap, and contradictions", () => {
  const trip = cloneTrip();
  trip.days.splice(2, 1);
  trip.logistics.accommodations[1].checkInDate = "2026-07-24";
  const hotel = validHotel();
  hotel.id = trip.logistics.accommodations[0].id;
  hotel.hotel.checkInDate = "2026-07-23";
  hotel.hotel.checkOutDate = "2026-07-25";
  hotel.hotel.address = trip.logistics.accommodations[0].address ?? null;
  const result = validateTripData(trip, [approved(hotel)]);
  const codes = new Set([...result.errors, ...result.warnings].map((item) => item.code));
  assert.ok(codes.has("MISSING_ITINERARY_DAY"));
  assert.ok(codes.has("DATE_GAP"));
  assert.ok(codes.has("LODGING_OVERLAP"));
  assert.ok(codes.has("CONTRADICTORY_MANUAL_IMPORTED_RECORD"));
});

test("trip validator detects rental ordering, flight range, and unsafe departure timing", () => {
  const rental = validRentalCar();
  rental.rentalCar.pickupLocalDateTime = "2026-07-29T12:00";
  rental.rentalCar.dropoffLocalDateTime = "2026-07-22T12:30";
  const flight = validFlight();
  flight.flight.segments[0].departureAirport = "ZRH";
  flight.flight.segments[0].departureLocalDateTime = "2026-07-29T13:25";
  flight.flight.segments[0].arrivalLocalDateTime = "2026-07-29T16:10";
  const result = validateTripData(getItinerary(), [approved(rental), approved(flight)]);
  assert.ok(result.errors.some((item) => item.code === "RENTAL_RETURN_BEFORE_PICKUP"));

  rental.rentalCar.pickupLocalDateTime = "2026-07-22T12:30";
  rental.rentalCar.dropoffLocalDateTime = "2026-07-29T12:00";
  const conflict = validateTripData(getItinerary(), [approved(rental), approved(flight)]);
  assert.ok(conflict.warnings.some((item) => item.code === "CONTRADICTORY_RENTAL_AND_FLIGHT"));

  flight.flight.segments[0].departureLocalDateTime = "2030-01-01T13:25";
  flight.flight.segments[0].arrivalLocalDateTime = "2030-01-01T16:10";
  const outside = validateTripData(getItinerary(), [approved(flight)]);
  assert.ok(outside.warnings.some((item) => item.code === "FLIGHT_OUTSIDE_TRIP"));
});
