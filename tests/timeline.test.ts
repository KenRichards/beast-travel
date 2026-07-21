import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateTodayDashboard,
  compareTimelineEvents,
  findNextEvent,
  groupTimelineByDay,
  normalizeLodgings,
  normalizeTimeline,
  selectCurrentLodging,
} from "../src/lib/timeline";
import { projectLocalDateTime, tripDateKey } from "../src/lib/trip-time";
import type {
  ApprovedReservation,
  NormalizedReservation,
} from "../src/lib/import/reservation";
import type { Itinerary } from "../src/types/itinerary";
import type { TimelineLodging } from "../src/types/timeline";
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

function itinerary(): Itinerary {
  return {
    trip: {
      id: "test-trip",
      title: "Test trip",
      subtitle: "July 10–12, 2030",
      heroImage: "/test.jpg",
      startDate: "2030-07-10",
      endDate: "2030-07-12",
      timezone: "Europe/Zurich",
    },
    days: [
      {
        day: 1,
        date: "2030-07-10",
        title: "Arrival",
        icon: "plane",
        location: "Zurich",
        image: "/test.jpg",
        transport: "Train",
        travelTime: "1 hour",
        budget: 100,
        description: "Arrival day",
        map: { center: { latitude: 47, longitude: 8 }, zoom: 10 },
        locations: [],
        schedule: [
          {
            id: "late-plan",
            time: "Any time",
            title: "Flexible plan",
            description: "No exact time",
            sourceStatus: "Authored itinerary",
          },
          {
            id: "morning-plan",
            time: "Morning",
            title: "Morning plan",
            description: "Approximate time",
            sourceStatus: "Authored itinerary",
          },
          {
            id: "exact-plan",
            time: "08:30",
            title: "Exact plan",
            description: "Exact time",
            sourceStatus: "Authored itinerary",
          },
        ],
        travelSegments: [
          {
            id: "station-transfer",
            from: "Airport",
            to: "Station",
            mode: "Train",
            sourceStatus: "Authored itinerary",
          },
        ],
        dailyBudget: {
          transportation: 0,
          attractions: 0,
          food: 0,
          lodging: 0,
          miscellaneous: 0,
          total: 0,
          currency: "CHF",
        },
        operations: {
          startLocation: "Airport",
          endLocation: "Hotel",
          departureWindow: "Morning",
          parking: [],
          meals: [],
          restAndRecovery: [],
          weatherSensitivity: "Low",
          reservationsAndTickets: [],
          physicalEffort: "Low",
          fallbackPlan: "Go directly to the hotel.",
        },
        notes: [],
      },
      {
        day: 2,
        date: "2030-07-11",
        title: "Mountains",
        icon: "mountain",
        location: "Alps",
        image: "/test.jpg",
        transport: "Train",
        travelTime: "2 hours",
        budget: 100,
        description: "Mountain day",
        map: { center: { latitude: 46, longitude: 8 }, zoom: 10 },
        locations: [],
        schedule: [],
        travelSegments: [],
        dailyBudget: {
          transportation: 0,
          attractions: 0,
          food: 0,
          lodging: 0,
          miscellaneous: 0,
          total: 0,
          currency: "CHF",
        },
        operations: {
          startLocation: "Hotel",
          endLocation: "Hotel",
          departureWindow: "Morning",
          parking: [],
          meals: [],
          restAndRecovery: [],
          weatherSensitivity: "High",
          reservationsAndTickets: [],
          physicalEffort: "Moderate",
          fallbackPlan: "Use a valley plan.",
        },
        notes: [],
      },
    ],
    logistics: {
      accommodations: [
        {
          id: "manual-hotel",
          name: "Manual Hotel",
          city: "Zurich",
          status: "planned",
          checkInDate: "2030-07-10",
          checkOutDate: "2030-07-12",
        },
      ],
      reservations: [
        {
          id: "manual-ticket",
          type: "attraction",
          title: "Manual ticket",
          status: "planned",
          date: "2030-07-11",
          source: "manual",
        },
      ],
      documents: [],
      checklist: [],
      emergencyNotes: [],
    },
  };
}

test("timeline normalization combines itinerary, logistics, and every imported reservation type", () => {
  const events = normalizeTimeline(itinerary(), [
    approved(validFlight()),
    approved(validHotel()),
    approved(validRentalCar()),
  ]);

  assert.equal(events.length, 12);
  assert.ok(events.some((event) => event.kind === "activity"));
  assert.ok(events.some((event) => event.kind === "transportation"));
  assert.ok(events.some((event) => event.kind === "accommodation-check-in"));
  assert.ok(events.some((event) => event.kind === "rental-car-return"));
  assert.ok(events.some((event) => event.kind === "flight"));
});

test("chronological sorting is deterministic for dates, times, and ties", () => {
  const events = normalizeTimeline(itinerary());
  const day = groupTimelineByDay(events).find(
    (candidate) => candidate.date === "2030-07-10",
  );
  assert.ok(day);
  assert.deepEqual(
    day.events.filter((event) => event.kind === "activity").map((event) => event.title),
    ["Exact plan", "Morning plan", "Flexible plan"],
  );

  const tied = day.events.filter((event) => event.sortMinute === 1440);
  assert.deepEqual(tied, [...tied].sort(compareTimelineEvents));
});

test("untimed and approximate entries retain useful labels without pretending precision", () => {
  const events = normalizeTimeline(itinerary());
  const flexible = events.find((event) => event.title === "Flexible plan");
  const morning = events.find((event) => event.title === "Morning plan");

  assert.equal(flexible?.time, undefined);
  assert.equal(flexible?.timeLabel, "Any time");
  assert.equal(flexible?.timePrecision, "date-only");
  assert.equal(morning?.timePrecision, "approximate");
  assert.equal(morning?.sortMinute, 540);
});

test("source-local times crossing midnight are grouped on the Zurich calendar day", () => {
  const flight = validFlight();
  flight.flight.segments[0].departureLocalDateTime = "2030-07-10T23:30";
  flight.flight.segments[0].departureTimezone = "America/Toronto";
  const events = normalizeTimeline(itinerary(), [approved(flight)]);
  const importedFlight = events.find(
    (event) => event.source === "imported" && event.kind === "flight",
  );

  assert.equal(importedFlight?.date, "2030-07-11");
  assert.equal(importedFlight?.time, "05:30");
  assert.deepEqual(
    projectLocalDateTime(
      "2030-07-10T23:30",
      "America/Toronto",
      "Europe/Zurich",
    ),
    {
      date: "2030-07-11",
      time: "05:30",
      epochMs: Date.parse("2030-07-11T03:30:00.000Z"),
    },
  );
  assert.equal(
    tripDateKey(new Date("2030-07-09T22:30:00.000Z"), "Europe/Zurich"),
    "2030-07-10",
  );
});

test("current lodging favors confirmed imported records and the latest check-in", () => {
  const lodgings: TimelineLodging[] = [
    {
      id: "manual",
      name: "Placeholder",
      city: "Zurich",
      checkInDate: "2030-07-01",
      checkOutDate: "2030-07-20",
      status: "planned",
      source: "manual",
    },
    {
      id: "imported-old",
      name: "First confirmed stay",
      city: "Zurich",
      checkInDate: "2030-07-01",
      checkOutDate: "2030-07-20",
      status: "confirmed",
      source: "imported",
    },
    {
      id: "imported-current",
      name: "Current confirmed stay",
      city: "Lucerne",
      checkInDate: "2030-07-10",
      checkOutDate: "2030-07-12",
      status: "confirmed",
      source: "imported",
    },
  ];

  assert.equal(selectCurrentLodging(lodgings, "2030-07-10")?.id, "imported-current");
  assert.equal(selectCurrentLodging(lodgings, "2030-07-20"), undefined);
});

test("next-event calculation ignores passed exact events but retains date-only items", () => {
  const events = normalizeTimeline(itinerary());
  const now = new Date("2030-07-10T07:00:00.000Z"); // 09:00 in Zurich
  const next = findNextEvent(events, now);

  assert.equal(next?.title, "Morning plan");
  const lateNow = new Date("2030-07-10T21:00:00.000Z"); // 23:00 in Zurich
  assert.equal(findNextEvent(events, lateNow)?.timePrecision, "date-only");
});

test("before-trip dashboard previews the first upcoming trip day", () => {
  const trip = itinerary();
  const events = normalizeTimeline(trip);
  const dashboard = calculateTodayDashboard(
    trip,
    events,
    normalizeLodgings(trip),
    new Date("2030-07-01T12:00:00.000Z"),
  );

  assert.equal(dashboard.phase, "before-trip");
  assert.equal(dashboard.date, "2030-07-10");
  assert.equal(dashboard.tripDayNumber, 1);
  assert.equal(dashboard.nextEvent?.title, "Exact plan");
});

test("during-trip dashboard uses Zurich date and provides lodging and day events", () => {
  const trip = itinerary();
  const events = normalizeTimeline(trip);
  const dashboard = calculateTodayDashboard(
    trip,
    events,
    normalizeLodgings(trip),
    new Date("2030-07-09T22:30:00.000Z"), // July 10 in Zurich
  );

  assert.equal(dashboard.phase, "during-trip");
  assert.equal(dashboard.date, "2030-07-10");
  assert.equal(dashboard.currentLodging?.name, "Manual Hotel");
  assert.ok(dashboard.upcomingEvents.length > 0);
  assert.ok(dashboard.transportationEvents.length > 0);
});

test("after-trip dashboard returns a completed state without operational suggestions", () => {
  const trip = itinerary();
  const dashboard = calculateTodayDashboard(
    trip,
    normalizeTimeline(trip),
    normalizeLodgings(trip),
    new Date("2030-07-13T12:00:00.000Z"),
  );

  assert.equal(dashboard.phase, "after-trip");
  assert.equal(dashboard.currentLodging, undefined);
  assert.equal(dashboard.nextEvent, undefined);
  assert.deepEqual(dashboard.upcomingEvents, []);
});

test("every imported timeline item links to its canonical reservation record", () => {
  const events = normalizeTimeline(itinerary(), [
    approved(validFlight()),
    approved(validHotel()),
    approved(validRentalCar()),
  ]).filter((event) => event.source === "imported");

  assert.ok(events.length > 0);
  assert.ok(
    events.every(
      (event) =>
        event.sourceLink.recordType === "reservation" &&
        event.sourceLink.href === `/reservations/${event.sourceLink.id}`,
    ),
  );
});
