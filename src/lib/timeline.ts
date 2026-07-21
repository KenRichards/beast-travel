import type { ApprovedReservation } from "@/lib/import/reservation";
import {
  clockMinute,
  epochForTripDateTime,
  isClockTime,
  isIsoDate,
  projectLocalDateTime,
  TRIP_TIME_ZONE,
  tripDateKey,
  tripMinuteOfDay,
} from "@/lib/trip-time";
import type { Itinerary, ItineraryDay, ScheduleItem } from "@/types/itinerary";
import type { Accommodation, TripReservation } from "@/types/logistics";
import type {
  TimelineDay,
  TimelineEvent,
  TimelineEventKind,
  TimelineLodging,
  TimelineTimePrecision,
  TodayDashboard,
} from "@/types/timeline";

const APPROXIMATE_TIMES: Record<string, number> = {
  "early morning": 7 * 60,
  morning: 9 * 60,
  "late morning": 11 * 60,
  noon: 12 * 60,
  "early afternoon": 13 * 60,
  afternoon: 15 * 60,
  "late afternoon": 17 * 60,
  evening: 19 * 60,
  night: 21 * 60,
};

const KIND_ORDER: Record<TimelineEventKind, number> = {
  flight: 0,
  "rental-car-pickup": 1,
  "accommodation-check-out": 2,
  transportation: 3,
  activity: 4,
  reservation: 5,
  "accommodation-check-in": 6,
  "rental-car-return": 7,
};

interface TimelineTime {
  time?: string;
  label: string;
  precision: TimelineTimePrecision;
  sortMinute: number;
  epochMs?: number;
}

function timeDetails(
  date: string,
  value?: string | null,
  timeZone = TRIP_TIME_ZONE,
): TimelineTime {
  if (isClockTime(value)) {
    return {
      time: value,
      label: value,
      precision: "exact",
      sortMinute: clockMinute(value),
      epochMs: epochForTripDateTime(date, value, timeZone),
    };
  }

  const label = value?.trim() || "Any time";
  const approximate = APPROXIMATE_TIMES[label.toLowerCase()];
  return {
    label,
    precision: approximate === undefined ? "date-only" : "approximate",
    sortMinute: approximate ?? 24 * 60,
  };
}

function itineraryLink(itinerary: Itinerary, day: ItineraryDay) {
  return {
    id: `day-${day.day}`,
    href: `/trips/${itinerary.trip.id}/day/${day.day}`,
    label: `Open itinerary day ${day.day}`,
    recordType: "itinerary-day" as const,
  };
}

function logisticsLink(itinerary: Itinerary) {
  return {
    id: `${itinerary.trip.id}-logistics`,
    href: `/trips/${itinerary.trip.id}/logistics`,
    label: "Open trip logistics",
    recordType: "trip-logistics" as const,
  };
}

function reservationLink(reservation: ApprovedReservation) {
  return {
    id: reservation.id,
    href: `/reservations/${reservation.id}`,
    label: "Open imported reservation",
    recordType: "reservation" as const,
  };
}

function createEvent(
  event: Omit<
    TimelineEvent,
    "time" | "timeLabel" | "timePrecision" | "sortMinute" | "epochMs"
  > & { rawTime?: string | null; timeZone?: string },
): TimelineEvent | null {
  if (!isIsoDate(event.date)) return null;
  const { rawTime, timeZone, ...base } = event;
  const time = timeDetails(event.date, rawTime, timeZone);
  return {
    ...base,
    time: time.time,
    timeLabel: time.label,
    timePrecision: time.precision,
    sortMinute: time.sortMinute,
    epochMs: time.epochMs,
  };
}

function normalizeScheduleItem(
  itinerary: Itinerary,
  day: ItineraryDay,
  item: ScheduleItem,
): TimelineEvent | null {
  if (!day.date) return null;
  const location = item.locationId
    ? day.locations.find((candidate) => candidate.id === item.locationId)
    : undefined;
  return createEvent({
    id: `itinerary-${day.day}-${item.id}`,
    tripId: itinerary.trip.id,
    kind: "activity",
    title: item.title,
    description: item.description,
    date: day.date,
    rawTime: item.time,
    location: location?.name ?? day.location,
    transport: item.transport,
    source: "itinerary",
    sourceLink: itineraryLink(itinerary, day),
  });
}

function normalizeItineraryEvents(itinerary: Itinerary): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const day of itinerary.days) {
    if (!day.date) continue;
    for (const item of day.schedule) {
      const event = normalizeScheduleItem(itinerary, day, item);
      if (event) events.push(event);
    }
    for (const segment of day.travelSegments) {
      const event = createEvent({
        id: `transport-${day.day}-${segment.id}`,
        tripId: itinerary.trip.id,
        kind: "transportation",
        reservationType: "train",
        title: `${segment.from} → ${segment.to}`,
        description: segment.notes?.join(" "),
        date: day.date,
        rawTime: segment.departureTime,
        endTime: isClockTime(segment.arrivalTime)
          ? segment.arrivalTime
          : undefined,
        location: `${segment.from} → ${segment.to}`,
        transport: segment.mode,
        source: "itinerary",
        sourceLink: itineraryLink(itinerary, day),
      });
      if (event) events.push(event);
    }
  }
  return events;
}

function accommodationEvents(
  itinerary: Itinerary,
  accommodation: Accommodation,
): TimelineEvent[] {
  const source = accommodation.source === "imported" ? "imported" : "manual";
  const sourceLink = accommodation.reservationDetailHref
    ? {
        id: accommodation.id,
        href: accommodation.reservationDetailHref,
        label: "Open imported reservation",
        recordType: "reservation" as const,
      }
    : logisticsLink(itinerary);
  const candidates = [
    createEvent({
      id: `lodging-${accommodation.id}-check-in`,
      tripId: itinerary.trip.id,
      kind: "accommodation-check-in",
      reservationType: "hotel",
      title: `Check in · ${accommodation.name}`,
      date: accommodation.checkInDate,
      rawTime: accommodation.checkInTime,
      location: accommodation.address ?? accommodation.city,
      confirmationReference: accommodation.confirmationReference,
      source,
      sourceLink,
    }),
    createEvent({
      id: `lodging-${accommodation.id}-check-out`,
      tripId: itinerary.trip.id,
      kind: "accommodation-check-out",
      reservationType: "hotel",
      title: `Check out · ${accommodation.name}`,
      date: accommodation.checkOutDate,
      rawTime: accommodation.checkOutTime,
      location: accommodation.address ?? accommodation.city,
      confirmationReference: accommodation.confirmationReference,
      source,
      sourceLink,
    }),
  ];
  return candidates.filter((event): event is TimelineEvent => event !== null);
}

function manualReservationEvent(
  itinerary: Itinerary,
  reservation: TripReservation,
): TimelineEvent | null {
  if (!reservation.date) return null;
  const source = reservation.source === "imported" ? "imported" : "manual";
  const sourceLink = reservation.reservationDetailHref
    ? {
        id: reservation.id,
        href: reservation.reservationDetailHref,
        label: "Open imported reservation",
        recordType: "reservation" as const,
      }
    : logisticsLink(itinerary);
  const kind: TimelineEventKind =
    reservation.type === "flight"
      ? "flight"
      : reservation.type === "rental-car"
        ? "rental-car-pickup"
        : reservation.type === "train" || reservation.type === "transfer"
          ? "transportation"
          : "reservation";
  return createEvent({
    id: `logistics-${reservation.id}`,
    tripId: itinerary.trip.id,
    kind,
    reservationType: reservation.type,
    title: reservation.title,
    description: reservation.notes?.join(" "),
    date: reservation.date,
    rawTime: reservation.startTime,
    endTime: isClockTime(reservation.endTime) ? reservation.endTime : undefined,
    location: reservation.location,
    provider: reservation.provider,
    confirmationReference: reservation.confirmationReference,
    source,
    sourceLink,
  });
}

function projectedReservationTime(
  value: string | null,
  sourceTimeZone: string | null | undefined,
) {
  if (!value) return undefined;
  const projected = projectLocalDateTime(
    value,
    sourceTimeZone || TRIP_TIME_ZONE,
    TRIP_TIME_ZONE,
  );
  if (projected) return projected;
  const date = value.slice(0, 10);
  const time = value.slice(11, 16);
  if (!isIsoDate(date)) return undefined;
  return {
    date,
    time: isClockTime(time) ? time : undefined,
    epochMs: undefined,
  };
}

function importedFlightEvents(
  itinerary: Itinerary,
  reservation: Extract<ApprovedReservation, { type: "flight" }>,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  reservation.flight.segments.forEach((segment, index) => {
    const departure = projectedReservationTime(
      segment.departureLocalDateTime,
      segment.departureTimezone,
    );
    if (!departure) return;
    const arrival = projectedReservationTime(
      segment.arrivalLocalDateTime,
      segment.arrivalTimezone,
    );
    const airports = [segment.departureAirport, segment.arrivalAirport]
      .filter(Boolean)
      .join(" → ");
    const event = createEvent({
      id: `imported-${reservation.id}-flight-${index + 1}`,
      tripId: itinerary.trip.id,
      kind: "flight",
      reservationType: "flight",
      title: [segment.flightNumber, airports || "Imported flight"]
        .filter(Boolean)
        .join(" · "),
      description: [
        segment.cabinClass,
        segment.operatingCarrier
          ? `Operated by ${segment.operatingCarrier}`
          : undefined,
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
      date: departure.date,
      rawTime: departure.time,
      endDate: arrival?.date,
      endTime: arrival?.time,
      location: airports || undefined,
      provider: segment.airline ?? reservation.provider ?? undefined,
      confirmationReference: reservation.confirmationNumber ?? undefined,
      source: "imported",
      sourceLink: reservationLink(reservation),
    });
    if (event) {
      event.epochMs = departure.epochMs;
      events.push(event);
    }
  });
  return events;
}

function importedHotelEvents(
  itinerary: Itinerary,
  reservation: Extract<ApprovedReservation, { type: "hotel" }>,
): TimelineEvent[] {
  const hotel = reservation.hotel;
  const candidates: TimelineEvent[] = [];
  if (hotel.checkInDate) {
    const event = createEvent({
      id: `imported-${reservation.id}-check-in`,
      tripId: itinerary.trip.id,
      kind: "accommodation-check-in",
      reservationType: "hotel",
      title: `Check in · ${hotel.propertyName ?? "Imported lodging"}`,
      date: hotel.checkInDate,
      rawTime: hotel.checkInTime,
      location: hotel.address ?? hotel.city ?? undefined,
      provider: reservation.provider ?? undefined,
      confirmationReference: reservation.confirmationNumber ?? undefined,
      source: "imported",
      sourceLink: reservationLink(reservation),
    });
    if (event) candidates.push(event);
  }
  if (hotel.checkOutDate) {
    const event = createEvent({
      id: `imported-${reservation.id}-check-out`,
      tripId: itinerary.trip.id,
      kind: "accommodation-check-out",
      reservationType: "hotel",
      title: `Check out · ${hotel.propertyName ?? "Imported lodging"}`,
      date: hotel.checkOutDate,
      rawTime: hotel.checkOutTime,
      location: hotel.address ?? hotel.city ?? undefined,
      provider: reservation.provider ?? undefined,
      confirmationReference: reservation.confirmationNumber ?? undefined,
      source: "imported",
      sourceLink: reservationLink(reservation),
    });
    if (event) candidates.push(event);
  }
  return candidates;
}

function importedRentalCarEvents(
  itinerary: Itinerary,
  reservation: Extract<ApprovedReservation, { type: "rental-car" }>,
): TimelineEvent[] {
  const car = reservation.rentalCar;
  const candidates: TimelineEvent[] = [];
  const pickup = projectedReservationTime(
    car.pickupLocalDateTime,
    car.timezone,
  );
  if (pickup) {
    const event = createEvent({
      id: `imported-${reservation.id}-pickup`,
      tripId: itinerary.trip.id,
      kind: "rental-car-pickup",
      reservationType: "rental-car",
      title: `Rental-car pickup${car.vehicleCategory ? ` · ${car.vehicleCategory}` : ""}`,
      date: pickup.date,
      rawTime: pickup.time,
      location: car.pickupLocation ?? undefined,
      provider: car.rentalProvider ?? reservation.provider ?? undefined,
      confirmationReference: reservation.confirmationNumber ?? undefined,
      source: "imported",
      sourceLink: reservationLink(reservation),
    });
    if (event) {
      event.epochMs = pickup.epochMs;
      candidates.push(event);
    }
  }
  const dropoff = projectedReservationTime(
    car.dropoffLocalDateTime,
    car.timezone,
  );
  if (dropoff) {
    const event = createEvent({
      id: `imported-${reservation.id}-return`,
      tripId: itinerary.trip.id,
      kind: "rental-car-return",
      reservationType: "rental-car",
      title: "Rental-car return",
      date: dropoff.date,
      rawTime: dropoff.time,
      location: car.dropoffLocation ?? undefined,
      provider: car.rentalProvider ?? reservation.provider ?? undefined,
      confirmationReference: reservation.confirmationNumber ?? undefined,
      source: "imported",
      sourceLink: reservationLink(reservation),
    });
    if (event) {
      event.epochMs = dropoff.epochMs;
      candidates.push(event);
    }
  }
  return candidates;
}

export function compareTimelineEvents(
  left: TimelineEvent,
  right: TimelineEvent,
): number {
  return (
    left.date.localeCompare(right.date) ||
    left.sortMinute - right.sortMinute ||
    (left.timePrecision === "exact" ? 0 : left.timePrecision === "approximate" ? 1 : 2) -
      (right.timePrecision === "exact" ? 0 : right.timePrecision === "approximate" ? 1 : 2) ||
    KIND_ORDER[left.kind] - KIND_ORDER[right.kind] ||
    left.source.localeCompare(right.source) ||
    left.id.localeCompare(right.id)
  );
}

export function normalizeTimeline(
  itinerary: Itinerary,
  approvedReservations: ApprovedReservation[] = [],
): TimelineEvent[] {
  const events = normalizeItineraryEvents(itinerary);
  const importedHotelIds = new Set(
    approvedReservations
      .filter((reservation) => reservation.type === "hotel")
      .map((reservation) => reservation.id),
  );
  itinerary.logistics.accommodations
    .filter((accommodation) => !importedHotelIds.has(accommodation.id))
    .forEach((accommodation) => {
    events.push(...accommodationEvents(itinerary, accommodation));
  });
  itinerary.logistics.reservations.forEach((reservation) => {
    const event = manualReservationEvent(itinerary, reservation);
    if (event) events.push(event);
  });
  approvedReservations.forEach((reservation) => {
    if (reservation.type === "flight") {
      events.push(...importedFlightEvents(itinerary, reservation));
    } else if (reservation.type === "hotel") {
      events.push(...importedHotelEvents(itinerary, reservation));
    } else {
      events.push(...importedRentalCarEvents(itinerary, reservation));
    }
  });
  return events.sort(compareTimelineEvents);
}

export function groupTimelineByDay(events: TimelineEvent[]): TimelineDay[] {
  const grouped = new Map<string, TimelineEvent[]>();
  [...events].sort(compareTimelineEvents).forEach((event) => {
    const day = grouped.get(event.date) ?? [];
    day.push(event);
    grouped.set(event.date, day);
  });
  return [...grouped].map(([date, dayEvents]) => ({ date, events: dayEvents }));
}

function importedLodging(
  reservation: Extract<ApprovedReservation, { type: "hotel" }>,
): TimelineLodging | null {
  const hotel = reservation.hotel;
  if (!hotel.propertyName || !hotel.checkInDate || !hotel.checkOutDate) {
    return null;
  }
  return {
    id: reservation.id,
    name: hotel.propertyName,
    city: hotel.city ?? "Location not provided",
    address: hotel.address ?? undefined,
    checkInDate: hotel.checkInDate,
    checkOutDate: hotel.checkOutDate,
    confirmationReference: reservation.confirmationNumber ?? undefined,
    status: "confirmed",
    source: "imported",
    reservationHref: `/reservations/${reservation.id}`,
  };
}

export function normalizeLodgings(
  itinerary: Itinerary,
  approvedReservations: ApprovedReservation[] = [],
): TimelineLodging[] {
  const manual = itinerary.logistics.accommodations.map((accommodation) => ({
    id: accommodation.id,
    name: accommodation.name,
    city: accommodation.city,
    address: accommodation.address,
    checkInDate: accommodation.checkInDate,
    checkOutDate: accommodation.checkOutDate,
    confirmationReference: accommodation.confirmationReference,
    status: accommodation.status,
    source: (accommodation.source === "imported" ? "imported" : "manual") as
      | "manual"
      | "imported",
    reservationHref: accommodation.reservationDetailHref,
  }));
  const imported = approvedReservations
    .filter(
      (reservation): reservation is Extract<
        ApprovedReservation,
        { type: "hotel" }
      > => reservation.type === "hotel",
    )
    .map(importedLodging)
    .filter((lodging): lodging is TimelineLodging => lodging !== null);
  const byId = new Map<string, TimelineLodging>(
    manual.map((lodging) => [lodging.id, lodging]),
  );
  imported.forEach((lodging) => byId.set(lodging.id, lodging));
  return [...byId.values()];
}

export function selectCurrentLodging(
  lodgings: TimelineLodging[],
  date: string,
): TimelineLodging | undefined {
  return lodgings
    .filter(
      (lodging) => date >= lodging.checkInDate && date < lodging.checkOutDate,
    )
    .sort(
      (left, right) =>
        Number(right.status === "confirmed") - Number(left.status === "confirmed") ||
        Number(right.source === "imported") - Number(left.source === "imported") ||
        right.checkInDate.localeCompare(left.checkInDate) ||
        left.checkOutDate.localeCompare(right.checkOutDate) ||
        left.id.localeCompare(right.id),
    )[0];
}

export function findNextEvent(
  events: TimelineEvent[],
  now: Date,
  date = tripDateKey(now, TRIP_TIME_ZONE),
  phase: TodayDashboard["phase"] = "during-trip",
): TimelineEvent | undefined {
  const currentMinute = tripMinuteOfDay(now, TRIP_TIME_ZONE);
  return [...events]
    .filter((event) => {
      if (event.date > date) return true;
      if (event.date < date) return false;
      if (phase === "before-trip") return true;
      if (event.timePrecision === "date-only") return true;
      if (event.epochMs !== undefined) return event.epochMs >= now.getTime();
      return event.sortMinute >= currentMinute;
    })
    .sort(compareTimelineEvents)[0];
}

export function calculateTodayDashboard(
  itinerary: Itinerary,
  events: TimelineEvent[],
  lodgings: TimelineLodging[],
  now = new Date(),
): TodayDashboard {
  const timeZone = TRIP_TIME_ZONE;
  const currentDate = tripDateKey(now, timeZone);
  const datedDays = itinerary.days
    .filter((day): day is ItineraryDay & { date: string } => Boolean(day.date))
    .sort((left, right) => left.date.localeCompare(right.date));
  const startDate = itinerary.trip.startDate ?? datedDays[0]?.date ?? currentDate;
  const endDate =
    itinerary.trip.endDate ?? datedDays.at(-1)?.date ?? startDate;
  const phase =
    currentDate < startDate
      ? "before-trip"
      : currentDate > endDate
        ? "after-trip"
        : "during-trip";
  const date = phase === "before-trip" ? startDate : currentDate;
  const day = datedDays.find((candidate) => candidate.date === date);
  const dayEvents = events.filter((event) => event.date === date);
  const currentMinute = tripMinuteOfDay(now, timeZone);
  const upcomingEvents =
    phase === "after-trip"
      ? []
      : dayEvents.filter((event) => {
          if (phase === "before-trip") return true;
          if (event.timePrecision === "date-only") return true;
          if (event.epochMs !== undefined) return event.epochMs >= now.getTime();
          return event.sortMinute >= currentMinute;
        });
  const transportationKinds = new Set<TimelineEventKind>([
    "flight",
    "transportation",
    "rental-car-pickup",
    "rental-car-return",
  ]);

  return {
    phase,
    date,
    tripDayNumber: day?.day,
    tripDayTitle: day?.title,
    currentLodging:
      phase === "after-trip" ? undefined : selectCurrentLodging(lodgings, date),
    nextEvent:
      phase === "after-trip"
        ? undefined
        : findNextEvent(events, now, date, phase),
    upcomingEvents: upcomingEvents.sort(compareTimelineEvents),
    transportationEvents: dayEvents.filter((event) =>
      transportationKinds.has(event.kind),
    ),
  };
}
