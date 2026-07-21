import type { ReservationProviderParser } from "../parser";
import type { FlightReservation, FlightSegment } from "../reservation";
import {
  cleanExtractedValue,
  createBaseReservation,
  firstCapture,
  normalizeClockTime,
  parseMonthDayYear,
  setEvidence,
} from "./shared";

const parserId = "air-canada-flight-v2";

const AIRPORT_TIMEZONES: Record<string, string> = {
  DTW: "America/Detroit",
  YUL: "America/Toronto",
  YQG: "America/Toronto",
  YYZ: "America/Toronto",
  ZRH: "Europe/Zurich",
};

function dateAfter(text: string, anchor: RegExp): string | null {
  const index = text.search(anchor);
  if (index < 0) return null;
  return parseMonthDayYear(text.slice(index, index + 240));
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function extractSegments(text: string): FlightSegment[] {
  const lines = text.split("\n");
  const departureDate = dateAfter(text, /\bDeparture\b/i);
  const returnDate = dateAfter(text, /\bReturn\b/i);
  const returnIndex = text.search(/\bReturn\b/i);
  const segments: FlightSegment[] = [];
  let characterIndex = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const [departureAirport, arrivalAirport] =
      line.match(/\b[A-Z]{3}\b/g) ?? [];

    if (!departureAirport || !arrivalAirport || /\bAirport\b/i.test(line)) {
      characterIndex += line.length + 1;
      continue;
    }

    const following = lines.slice(lineIndex + 1, lineIndex + 8).join("\n");
    const times = /(\d{1,2}:\d{2})(?:\s*[AP]M)?\s+(\d{1,2}:\d{2})(?:\s*[AP]M)?(?:\s*\+\s*(\d)\s*day)?/i.exec(
      following,
    );
    const flightNumberMatch = /\b([A-Z]{2})\s*(\d{2,4})\b/.exec(following);

    if (!times || !flightNumberMatch) {
      characterIndex += line.length + 1;
      continue;
    }

    const sectionDate =
      returnIndex >= 0 && characterIndex > returnIndex
        ? returnDate
        : departureDate;
    const departureTime = normalizeClockTime(times[1]);
    const arrivalTime = normalizeClockTime(times[2]);
    const arrivalDayOffset = Number(times[3] ?? 0);
    const operatingCarrier = firstCapture(following, [
      /Operated by\s+([^\n]+)/i,
    ]);
    const cabinClass = firstCapture(
      lines.slice(Math.max(0, lineIndex - 5), lineIndex + 10).join("\n"),
      [/Cabin:\s*([^\n]+)/i, /\b(Premium Economy|Economy Class|Business Class)\b/i],
    );

    segments.push({
      id: `segment-${segments.length + 1}`,
      airline: "Air Canada",
      flightNumber: `${flightNumberMatch[1].toUpperCase()} ${flightNumberMatch[2]}`,
      departureAirport,
      arrivalAirport,
      departureLocalDateTime:
        sectionDate && departureTime ? `${sectionDate}T${departureTime}` : null,
      arrivalLocalDateTime:
        sectionDate && arrivalTime
          ? `${addDays(sectionDate, arrivalDayOffset)}T${arrivalTime}`
          : null,
      departureTimezone: AIRPORT_TIMEZONES[departureAirport] ?? null,
      arrivalTimezone: AIRPORT_TIMEZONES[arrivalAirport] ?? null,
      cabinClass,
      operatingCarrier,
    });
    characterIndex += line.length + 1;
  }

  return segments.filter(
    (segment, index, candidates) =>
      candidates.findIndex(
        (candidate) =>
          candidate.flightNumber === segment.flightNumber &&
          candidate.departureAirport === segment.departureAirport &&
          candidate.departureLocalDateTime === segment.departureLocalDateTime,
      ) === index,
  );
}

function extractTravelers(text: string): string[] {
  const passengerSection = /\bPassengers\b\s*\n([\s\S]{1,600}?)(?:\nTicket\s*#|\nSeats\b|\nPrice\b)/i.exec(
    text,
  )?.[1];
  if (!passengerSection) return [];

  return passengerSection
    .split("\n")
    .map((line) => cleanExtractedValue(line))
    .filter((line): line is string => Boolean(line))
    .filter(
      (line) =>
        /^[\p{L}][\p{L}' -]{3,80}$/u.test(line) &&
        !/ticket|aeroplan|seat|cabin|economy/i.test(line),
    )
    .filter((line, index, names) => names.indexOf(line) === index);
}

export const genericFlightParser: ReservationProviderParser = {
  id: parserId,
  displayName: "Air Canada Itinerary",
  canParse(classification) {
    return (
      classification.probableType === "flight" &&
      classification.probableProvider?.id === "air-canada"
    );
  },
  async parse(analysis, classification) {
    const text = analysis.text.sample;
    const base = createBaseReservation(
      "flight",
      "Air Canada",
      parserId,
      analysis,
      classification,
    );
    const confirmationNumber = firstCapture(text, [
      /Booking reference:\s*([A-Z0-9]{5,10})/i,
      /Booking reference[\s\n]+([A-Z0-9]{5,10})/i,
    ]);
    const segments = extractSegments(text);
    const travelers = extractTravelers(text);
    const evidence = base.evidence;

    setEvidence(evidence, "provider", base.provider, analysis);
    setEvidence(evidence, "confirmationNumber", confirmationNumber, analysis);
    setEvidence(evidence, "travelers", travelers, analysis);
    setEvidence(evidence, "flight.airline", "Air Canada", analysis);
    setEvidence(evidence, "flight.bookingReference", confirmationNumber, analysis);
    setEvidence(evidence, "flight.segments", segments, analysis);
    segments.forEach((segment, index) => {
      const prefix = `flight.segments.${index}`;
      for (const [field, value] of Object.entries(segment)) {
        if (field !== "id") setEvidence(evidence, `${prefix}.${field}`, value, analysis);
      }
    });

    return {
      ...base,
      type: "flight",
      confirmationNumber,
      travelers,
      evidence,
      flight: {
        airline: "Air Canada",
        bookingReference: confirmationNumber,
        segments,
      },
    } satisfies FlightReservation;
  },
};
