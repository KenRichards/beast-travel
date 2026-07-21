import type { ReservationProviderParser } from "../parser";
import type { RentalCarReservation } from "../reservation";
import {
  cleanExtractedValue,
  combineLocalDateTime,
  createBaseReservation,
  extractFullDates,
  firstCapture,
  normalizeClockTime,
  setEvidence,
} from "./shared";

const parserId = "booking-com-rental-car-v2";

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

interface CarEndpoint {
  dateTime: string | null;
  location: string | null;
}

function parseCarEndpoints(text: string): CarEndpoint[] {
  const fullDates = extractFullDates(text);
  const shortYear = /\b\d{1,2}[/-]\d{1,2}[/-](\d{2,4})\b/.exec(text)?.[1];
  const year =
    Number(fullDates[0]?.date.slice(0, 4)) ||
    Number(/\b(20\d{2})\b/.exec(text)?.[1]) ||
    Number(shortYear?.length === 2 ? `20${shortYear}` : shortYear);
  const lines = text.split("\n");
  const endpoints: CarEndpoint[] = [];
  const datePattern = /(?:Sun|Mon|Tue|Tues|Wed|Thu|Thur|Fri|Sat)[a-z]*,?\s+([A-Za-z]{3,9})\s+(\d{1,2})(?:,?\s+(20\d{2}))?\s*[-–—]\s*(\d{1,2}:\d{2}\s*[AP]M)/i;

  for (let index = 0; index < lines.length && endpoints.length < 2; index += 1) {
    const match = datePattern.exec(lines[index].trim());
    if (!match) continue;
    const month = MONTHS[match[1].toLowerCase()];
    const endpointYear = Number(match[3]) || year;
    const day = Number(match[2]);
    const time = normalizeClockTime(match[4]);
    const date =
      endpointYear && month && day >= 1 && day <= 31
        ? `${endpointYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        : null;
    const location = lines
      .slice(index + 1, index + 4)
      .map((line) => cleanExtractedValue(line))
      .find(
        (line): line is string =>
          Boolean(line) &&
          !/days?|at airport|car rental|pick|drop/i.test(line ?? ""),
      );

    endpoints.push({ dateTime: combineLocalDateTime(date, time), location: location ?? null });
  }

  return endpoints;
}

function extractCoverage(text: string): string[] {
  const terms = [
    "Unlimited mileage",
    "Collision Damage Waiver",
    "Theft Protection",
    "Third-Party Liability",
  ].filter((term) => new RegExp(term, "i").test(text));
  return terms.filter(
    (term) =>
      !new RegExp(`(?:doesn['’]t|does not) include[^.]{0,80}${term}`, "i").test(text),
  );
}

export const genericRentalCarParser: ReservationProviderParser = {
  id: parserId,
  displayName: "Booking.com Rental Car",
  canParse(classification) {
    return (
      classification.probableType === "rental-car" &&
      classification.probableProvider?.id === "booking-com"
    );
  },
  async parse(analysis, classification) {
    const text = analysis.text.sample;
    const base = createBaseReservation(
      "rental-car",
      "Booking.com",
      parserId,
      analysis,
      classification,
    );
    const confirmationNumber = firstCapture(text, [
      /Booking number\s*\n?\s*([A-Z0-9-]{6,30})/i,
      /Booking reference\s*[:\n]\s*([A-Z0-9-]{6,30})/i,
    ]);
    const endpoints = parseCarEndpoints(text);
    const pickup = endpoints[0] ?? { dateTime: null, location: null };
    const dropoff = endpoints[1] ?? { dateTime: null, location: null };
    const providerMatches = Array.from(
      text.matchAll(/\bAddress\s*\n\s*([^,\n]{2,40}),/gi),
    );
    const rentalProvider = firstCapture(text, [
      /Supplied by\s+([^\n]{2,80})/i,
      /(?:Rental company|Rental provider|Supplier|Provided by)\s*[:\n]\s*([^\n]{2,80})/i,
    ]) ?? cleanExtractedValue(providerMatches.at(-1)?.[1]);
    const vehicleCategory = firstCapture(text, [
      /^([^\n]{3,100}\bor similar)\s*$/im,
      /Vehicle(?: category| class)?\s*[:\n]\s*([^\n]{3,100})/i,
    ]);
    const primaryDriver = firstCapture(text, [
      /(?:Main|Primary) driver\s*(?:[:\n]\s*)?([^\n]{3,100})/i,
      /Driver['’]?s name\s*[:\n]\s*([^\n]{3,100})/i,
    ]);
    const includedCoverage = extractCoverage(text);
    const timezone = /\bZ[uü]rich\b/i.test(
      `${pickup.location ?? ""} ${dropoff.location ?? ""}`,
    )
      ? "Europe/Zurich"
      : null;
    const evidence = base.evidence;

    setEvidence(evidence, "provider", base.provider, analysis);
    setEvidence(evidence, "confirmationNumber", confirmationNumber, analysis);
    setEvidence(evidence, "rentalCar.rentalProvider", rentalProvider, analysis);
    setEvidence(evidence, "rentalCar.bookingPlatform", "Booking.com", analysis);
    setEvidence(evidence, "rentalCar.pickupLocation", pickup.location, analysis);
    setEvidence(
      evidence,
      "rentalCar.pickupLocalDateTime",
      pickup.dateTime,
      analysis,
      "inferred",
    );
    setEvidence(evidence, "rentalCar.dropoffLocation", dropoff.location, analysis);
    setEvidence(
      evidence,
      "rentalCar.dropoffLocalDateTime",
      dropoff.dateTime,
      analysis,
      "inferred",
    );
    setEvidence(evidence, "rentalCar.timezone", timezone, analysis, "inferred");
    setEvidence(evidence, "rentalCar.vehicleCategory", vehicleCategory, analysis);
    setEvidence(evidence, "rentalCar.primaryDriver", primaryDriver, analysis);
    setEvidence(evidence, "rentalCar.includedCoverage", includedCoverage, analysis);

    return {
      ...base,
      type: "rental-car",
      confirmationNumber,
      evidence,
      rentalCar: {
        rentalProvider,
        bookingPlatform: "Booking.com",
        pickupLocation: pickup.location,
        pickupLocalDateTime: pickup.dateTime,
        dropoffLocation: dropoff.location,
        dropoffLocalDateTime: dropoff.dateTime,
        timezone,
        vehicleCategory,
        primaryDriver,
        includedCoverage,
      },
    } satisfies RentalCarReservation;
  },
};
