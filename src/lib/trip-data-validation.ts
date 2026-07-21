import type { ApprovedReservation } from "@/lib/import/reservation";
import { isClockTime, isIsoDate } from "@/lib/trip-time";
import type { Itinerary, ItineraryDay } from "@/types/itinerary";
import type { Accommodation } from "@/types/logistics";

export type TripDataIssueSeverity = "error" | "warning";

export interface TripDataIssue {
  severity: TripDataIssueSeverity;
  code: string;
  path: string;
  message: string;
  action: string;
}

export interface TripDataValidationResult {
  valid: boolean;
  errors: TripDataIssue[];
  warnings: TripDataIssue[];
}

const FLEXIBLE_TIME = /^(early |late |mid-)?(morning|afternoon|evening)$|^(flexible|optional|weather dependent|needs confirmation|any time)$/i;
const CLOCK_RANGE = /^(?:recommended )?\d{2}:\d{2}[–-]\d{2}:\d{2}$/i;

function utcDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

function addDays(date: string, count: number): string {
  const value = utcDate(date);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function datePart(value: string | null | undefined): string | undefined {
  return value?.slice(0, 10) || undefined;
}

function timePart(value: string | null | undefined): string | undefined {
  return value?.slice(11, 16) || undefined;
}

function issue(
  severity: TripDataIssueSeverity,
  code: string,
  path: string,
  message: string,
  action: string,
): TripDataIssue {
  return { severity, code, path, message, action };
}

function accommodationChecks(
  accommodations: Accommodation[],
  startDate: string,
  endDate: string,
): TripDataIssue[] {
  const issues: TripDataIssue[] = [];
  const sorted = [...accommodations].sort((left, right) =>
    left.checkInDate.localeCompare(right.checkInDate),
  );

  sorted.forEach((stay, index) => {
    const path = `logistics.accommodations[${index}]`;
    if (!isIsoDate(stay.checkInDate) || !isIsoDate(stay.checkOutDate)) {
      issues.push(issue("error", "MALFORMED_LODGING_DATE", path, `${stay.name} has a malformed check-in or checkout date.`, "Use YYYY-MM-DD dates."));
      return;
    }
    if (stay.checkOutDate <= stay.checkInDate) {
      issues.push(issue("error", "CHECKOUT_BEFORE_CHECKIN", path, `${stay.name} checks out on or before it checks in.`, "Correct the approved stay dates."));
    }
    if (stay.checkInTime && !isClockTime(stay.checkInTime)) {
      issues.push(issue("error", "MALFORMED_TIME", `${path}.checkInTime`, `${stay.name} has malformed check-in time ${stay.checkInTime}.`, "Use a 24-hour HH:MM value."));
    }
    if (stay.checkOutTime && !isClockTime(stay.checkOutTime)) {
      issues.push(issue("error", "MALFORMED_TIME", `${path}.checkOutTime`, `${stay.name} has malformed checkout time ${stay.checkOutTime}.`, "Use a 24-hour HH:MM value."));
    }
  });

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (current.checkInDate < previous.checkOutDate) {
      issues.push(issue("error", "LODGING_OVERLAP", `logistics.accommodations.${current.id}`, `${current.name} begins before ${previous.name} checks out.`, "Reconcile the approved lodging dates or remove a duplicate stay."));
    } else if (current.checkInDate > previous.checkOutDate) {
      issues.push(issue("error", "LODGING_GAP", `logistics.accommodations.${current.id}`, `No lodging covers ${previous.checkOutDate} through ${current.checkInDate}.`, "Add the missing stay or correct the adjacent dates."));
    }
  }

  if (!sorted.length || sorted[0].checkInDate > startDate) {
    issues.push(issue("error", "LODGING_GAP", "logistics.accommodations", `No lodging begins on trip start ${startDate}.`, "Add or correct the first stay."));
  }
  const tripNightEnd = endDate;
  if (!sorted.length || sorted.at(-1)!.checkOutDate < tripNightEnd) {
    issues.push(issue("error", "LODGING_GAP", "logistics.accommodations", `Lodging ends before departure day ${endDate}.`, "Add or correct the final stay."));
  }
  return issues;
}

function dayChecks(
  itinerary: Itinerary,
  reservationIds: Set<string>,
  validateReferences: boolean,
): TripDataIssue[] {
  const issues: TripDataIssue[] = [];
  const numbers = new Map<number, number>();
  const dates = new Map<string, number>();
  const startDate = itinerary.trip.startDate!;
  const endDate = itinerary.trip.endDate!;
  const expectedDays = Math.round((utcDate(endDate).getTime() - utcDate(startDate).getTime()) / 86_400_000) + 1;

  itinerary.days.forEach((day, index) => {
    const path = `days[${index}]`;
    numbers.set(day.day, (numbers.get(day.day) ?? 0) + 1);
    if (day.date) dates.set(day.date, (dates.get(day.date) ?? 0) + 1);
    if (!day.date || !isIsoDate(day.date)) {
      issues.push(issue("error", "MALFORMED_DAY_DATE", `${path}.date`, `Day ${day.day} does not have a valid ISO date.`, "Use a YYYY-MM-DD date."));
    } else if (day.date < startDate || day.date > endDate) {
      issues.push(issue("error", "EVENT_OUTSIDE_TRIP", `${path}.date`, `Day ${day.day} falls outside the trip dates.`, "Correct the day date or trip boundary."));
    }
    if (day.schedule.length < 3) {
      issues.push(issue("error", "INSUFFICIENT_DAY_CONTENT", `${path}.schedule`, `Day ${day.day} has too little meaningful schedule content.`, "Add an ordered operational plan."));
    }
    if (!day.operations?.fallbackPlan?.trim()) {
      issues.push(issue("error", "MISSING_FALLBACK", `${path}.operations.fallbackPlan`, `Day ${day.day} has no fallback plan.`, "Add a concrete fallback or flexibility note."));
    }
    if (!day.operations?.startLocation || !day.operations?.endLocation) {
      issues.push(issue("error", "MISSING_OPERATIONAL_LINK", `${path}.operations`, `Day ${day.day} lacks a start or end location.`, "Add both operational endpoints."));
    }
    const locationIds = new Set(day.locations.map((location) => location.id));
    const allItems = [...day.locations, ...day.schedule, ...day.travelSegments];
    allItems.forEach((item, itemIndex) => {
      if (!("sourceStatus" in item) || !item.sourceStatus) {
        issues.push(issue("error", "MISSING_SOURCE_STATUS", `${path}.items[${itemIndex}]`, `An itinerary item on Day ${day.day} has no fact/recommendation label.`, "Set sourceStatus explicitly."));
      }
      if ("reservationStatus" in item && item.reservationStatus === "confirmed" && item.sourceStatus !== "Confirmed reservation") {
        issues.push(issue("error", "SUGGESTION_MARKED_CONFIRMED", `${path}.locations[${itemIndex}]`, `${item.name} is marked confirmed without confirmed-reservation provenance.`, "Mark it recommended/optional or attach a confirmed reservation."));
      }
      if ("reservationReference" in item && item.reservationReference && validateReferences && !reservationIds.has(item.reservationReference)) {
        issues.push(issue("error", "ORPHANED_RESERVATION_REFERENCE", `${path}.items[${itemIndex}].reservationReference`, `${item.reservationReference} does not resolve to an approved reservation.`, "Correct the reference or restore the approved record."));
      }
      if ("sourceStatus" in item && item.sourceStatus === "Confirmed reservation" && !("reservationReference" in item && item.reservationReference)) {
        issues.push(issue("error", "MISSING_OPERATIONAL_LINK", `${path}.items[${itemIndex}]`, `A confirmed item on Day ${day.day} has no reservation reference.`, "Link the authoritative approved reservation."));
      }
    });
    day.schedule.forEach((item, scheduleIndex) => {
      if (item.locationId && !locationIds.has(item.locationId)) {
        issues.push(issue("error", "MISSING_OPERATIONAL_LINK", `${path}.schedule[${scheduleIndex}].locationId`, `${item.locationId} is not defined in Day ${day.day} locations.`, "Add the location or remove the broken reference."));
      }
      const value = item.time.trim();
      const recommendedClock = value.match(/^recommended (\d{2}:\d{2})$/i)?.[1];
      const recommendedByClock = value.match(/^recommended by (\d{2}:\d{2})$/i)?.[1];
      if (!isClockTime(value) && !FLEXIBLE_TIME.test(value) && !CLOCK_RANGE.test(value) && !isClockTime(recommendedClock) && !isClockTime(recommendedByClock)) {
        issues.push(issue("warning", "MALFORMED_TIME", `${path}.schedule[${scheduleIndex}].time`, `${item.time} is not a recognized exact, range, or flexible time label.`, "Use HH:MM, an HH:MM–HH:MM range, or a supported flexible label."));
      }
    });
  });

  for (let number = 1; number <= expectedDays; number += 1) {
    if (!numbers.has(number)) issues.push(issue("error", "MISSING_ITINERARY_DAY", "days", `Itinerary Day ${number} is missing.`, "Add the missing day."));
    if ((numbers.get(number) ?? 0) > 1) issues.push(issue("error", "DUPLICATE_DAY_NUMBER", "days", `Itinerary Day ${number} is duplicated.`, "Assign unique consecutive day numbers."));
    const expectedDate = addDays(startDate, number - 1);
    if (!dates.has(expectedDate)) issues.push(issue("error", "DATE_GAP", "days", `No itinerary day represents ${expectedDate}.`, "Add the missing calendar date."));
    if ((dates.get(expectedDate) ?? 0) > 1) issues.push(issue("error", "DUPLICATE_DAY_DATE", "days", `${expectedDate} is assigned more than once.`, "Assign each trip date once."));
  }
  return issues;
}

function reservationChecks(
  itinerary: Itinerary,
  reservations: ApprovedReservation[],
): TripDataIssue[] {
  const issues: TripDataIssue[] = [];
  const startDate = itinerary.trip.startDate!;
  const endDate = itinerary.trip.endDate!;
  const rentals = reservations.filter((reservation) => reservation.type === "rental-car");
  const flights = reservations.filter((reservation) => reservation.type === "flight");

  itinerary.logistics.reservations.forEach((reservation, index) => {
    if (reservation.date && (reservation.date < startDate || reservation.date > endDate)) {
      issues.push(issue("error", "EVENT_OUTSIDE_TRIP", `logistics.reservations[${index}].date`, `${reservation.title} falls outside the trip dates.`, "Correct the event date or remove it from this trip."));
    }
  });

  for (const reservation of reservations) {
    const reservationTripId = (reservation as ApprovedReservation & { tripId?: string }).tripId;
    if (reservationTripId && reservationTripId !== itinerary.trip.id) {
      issues.push(issue("error", "INCONSISTENT_TRIP_ID", `reservations.${reservation.id}.tripId`, `${reservation.id} belongs to ${reservationTripId}, not ${itinerary.trip.id}.`, "Move or reassign the record."));
    }
    if (reservation.travelers.length > (itinerary.trip.travelers ?? Number.POSITIVE_INFINITY)) {
      issues.push(issue("error", "INCONSISTENT_TRAVELERS", `reservations.${reservation.id}.travelers`, `${reservation.id} lists more travelers than the trip.`, "Reconcile the traveler list."));
    }
  }

  for (const rental of rentals) {
    const pickup = rental.rentalCar.pickupLocalDateTime;
    const dropoff = rental.rentalCar.dropoffLocalDateTime;
    if (pickup && dropoff && dropoff <= pickup) {
      issues.push(issue("error", "RENTAL_RETURN_BEFORE_PICKUP", `reservations.${rental.id}.rentalCar`, "Rental return occurs before pickup.", "Correct the approved rental timestamps."));
    }
    for (const [label, value] of [["pickupLocalDateTime", pickup], ["dropoffLocalDateTime", dropoff]] as const) {
      const date = datePart(value);
      const time = timePart(value);
      if (value && (!date || !time || !isIsoDate(date) || !isClockTime(time))) {
        issues.push(issue("error", "MALFORMED_TIME", `reservations.${rental.id}.rentalCar.${label}`, `${value} is malformed.`, "Use YYYY-MM-DDTHH:MM in the reservation timezone."));
      }
    }
  }

  for (const flight of flights) {
    for (const [index, segment] of flight.flight.segments.entries()) {
      const departureDate = datePart(segment.departureLocalDateTime);
      const arrivalDate = datePart(segment.arrivalLocalDateTime);
      const intersectsTrip = Boolean(
        (departureDate && departureDate >= startDate && departureDate <= endDate) ||
        (arrivalDate && arrivalDate >= startDate && arrivalDate <= endDate),
      );
      const adjacentSegments = [
        flight.flight.segments[index - 1],
        flight.flight.segments[index + 1],
      ].filter(Boolean);
      const connectedToTrip = adjacentSegments.some((adjacent) => {
        const adjacentDeparture = datePart(adjacent.departureLocalDateTime);
        const adjacentArrival = datePart(adjacent.arrivalLocalDateTime);
        const adjacentIntersects = Boolean(
          (adjacentDeparture && adjacentDeparture >= startDate && adjacentDeparture <= endDate) ||
          (adjacentArrival && adjacentArrival >= startDate && adjacentArrival <= endDate),
        );
        return adjacentIntersects && (
          segment.arrivalAirport === adjacent.departureAirport ||
          segment.departureAirport === adjacent.arrivalAirport
        );
      });
      if (!intersectsTrip && !connectedToTrip) {
        issues.push(issue("warning", "FLIGHT_OUTSIDE_TRIP", `reservations.${flight.id}.flight.segments[${index}]`, `${segment.flightNumber ?? "A flight"} does not intersect the trip dates.`, "Confirm it belongs to this trip or remove the record."));
      }
      for (const [label, value] of [["departureLocalDateTime", segment.departureLocalDateTime], ["arrivalLocalDateTime", segment.arrivalLocalDateTime]] as const) {
        const date = datePart(value);
        const time = timePart(value);
        if (value && (!date || !time || !isIsoDate(date) || !isClockTime(time))) {
          issues.push(issue("error", "MALFORMED_TIME", `reservations.${flight.id}.flight.segments[${index}].${label}`, `${value} is malformed.`, "Use YYYY-MM-DDTHH:MM with the airport-local timezone."));
        }
      }
    }
  }

  const outbound = flights.flatMap((flight) => flight.flight.segments).find((segment) => segment.departureAirport === "ZRH" && datePart(segment.departureLocalDateTime) === endDate);
  const endRental = rentals.find((rental) => datePart(rental.rentalCar.dropoffLocalDateTime) === endDate);
  if (outbound?.departureLocalDateTime && endRental?.rentalCar.dropoffLocalDateTime) {
    const flightMinute = Number(timePart(outbound.departureLocalDateTime)!.slice(0, 2)) * 60 + Number(timePart(outbound.departureLocalDateTime)!.slice(3));
    const returnMinute = Number(timePart(endRental.rentalCar.dropoffLocalDateTime)!.slice(0, 2)) * 60 + Number(timePart(endRental.rentalCar.dropoffLocalDateTime)!.slice(3));
    if (flightMinute - returnMinute < 180) {
      issues.push(issue("warning", "CONTRADICTORY_RENTAL_AND_FLIGHT", `reservations.${endRental.id}`, `The rental return leaves only ${flightMinute - returnMinute} minutes before the international flight.`, "Confirm a substantially earlier return time or authorized early-drop procedure."));
    }
  }

  const manualById = new Map(itinerary.logistics.accommodations.map((stay) => [stay.id, stay]));
  for (const reservation of reservations) {
    if (reservation.type !== "hotel") continue;
    const manual = manualById.get(reservation.id);
    if (!manual) continue;
    const hotel = reservation.hotel;
    if (manual.checkInDate !== hotel.checkInDate || manual.checkOutDate !== hotel.checkOutDate || (hotel.address && manual.address !== hotel.address)) {
      issues.push(issue("error", "CONTRADICTORY_MANUAL_IMPORTED_RECORD", `logistics.accommodations.${manual.id}`, `${manual.name} contradicts its approved imported record.`, "Reconcile low-confidence OCR against the source document, then update both projections."));
    }
  }
  return issues;
}

export function validateTripData(
  itinerary: Itinerary,
  reservations: ApprovedReservation[] = [],
): TripDataValidationResult {
  const issues: TripDataIssue[] = [];
  const startDate = itinerary.trip.startDate;
  const endDate = itinerary.trip.endDate;
  if (!startDate || !endDate || !isIsoDate(startDate) || !isIsoDate(endDate) || endDate < startDate) {
    issues.push(issue("error", "INVALID_TRIP_DATES", "trip", "Trip start/end dates are missing, malformed, or reversed.", "Set a valid inclusive YYYY-MM-DD range."));
  } else {
    const reservationIds = new Set(reservations.map((reservation) => reservation.id));
    issues.push(...dayChecks(itinerary, reservationIds, reservations.length > 0));
    issues.push(...accommodationChecks(itinerary.logistics.accommodations, startDate, endDate));
    issues.push(...reservationChecks(itinerary, reservations));
  }
  const errors = issues.filter((candidate) => candidate.severity === "error");
  const warnings = issues.filter((candidate) => candidate.severity === "warning");
  return { valid: errors.length === 0, errors, warnings };
}

export function formatTripDataValidation(result: TripDataValidationResult): string {
  const lines = [`Trip data validation: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`];
  for (const candidate of [...result.errors, ...result.warnings]) {
    lines.push(`${candidate.severity.toUpperCase()} ${candidate.code} ${candidate.path}: ${candidate.message} Action: ${candidate.action}`);
  }
  return lines.join("\n");
}

export function itineraryDayForDate(days: ItineraryDay[], date: string): ItineraryDay | undefined {
  return days.find((day) => day.date === date);
}
