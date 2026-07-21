import {
  reservationIdFromFingerprint,
  type ExtractionConfidence,
  type EvidenceSource,
  type ExtractionMethod,
  type FieldEvidence,
  type NormalizedReservation,
} from "../reservation";
import { isSafeIncomingFilename } from "../documents";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function limitedString(value: unknown, maximum = 500): string | null {
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maximum) : null;
}

function requiredString(value: unknown, maximum = 500): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maximum)
    : null;
}

function stringList(value: unknown, maximumItems = 50): string[] {
  return Array.isArray(value)
    ? value
        .map((item) => limitedString(item, 2_000))
        .filter((item): item is string => item !== null)
        .slice(0, maximumItems)
    : [];
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseEvidence(value: unknown): Record<string, FieldEvidence> {
  if (!isRecord(value)) return {};
  const confidenceValues: ExtractionConfidence[] = [
    "high",
    "medium",
    "low",
    "not-found",
  ];
  const sourceValues: EvidenceSource[] = [
    "native-text",
    "local-ocr",
    "unavailable",
    "user-edited",
    "not-found",
  ];
  const evidence: Record<string, FieldEvidence> = {};

  for (const [path, candidate] of Object.entries(value).slice(0, 200)) {
    if (
      path.length > 160 ||
      !isRecord(candidate) ||
      !confidenceValues.includes(candidate.confidence as ExtractionConfidence) ||
      !sourceValues.includes(candidate.source as EvidenceSource)
    ) {
      continue;
    }
    evidence[path] = {
      confidence: candidate.confidence as ExtractionConfidence,
      source: candidate.source as EvidenceSource,
    };
  }

  return evidence;
}

function parseCommon(input: UnknownRecord) {
  const fingerprint = requiredString(input.documentFingerprint, 64);
  const sourceFilename = requiredString(input.sourceFilename, 255);
  const source = isRecord(input.source) ? input.source : null;

  if (
    !fingerprint ||
    !/^[a-f0-9]{64}$/.test(fingerprint) ||
    !sourceFilename ||
    !isSafeIncomingFilename(sourceFilename) ||
    !source ||
    source.fingerprint !== fingerprint ||
    source.filename !== sourceFilename ||
    source.documentReference !== `incoming/${sourceFilename}`
  ) {
    return null;
  }

  const extractionMethod = source.extractionMethod;
  if (
    extractionMethod !== "native-text" &&
    extractionMethod !== "local-ocr" &&
    extractionMethod !== "unavailable"
  ) {
    return null;
  }

  const parserId = requiredString(source.parserId, 100);
  if (!parserId) return null;
  const safeExtractionMethod = extractionMethod as ExtractionMethod;

  return {
    schemaVersion: 2 as const,
    id: reservationIdFromFingerprint(fingerprint),
    documentFingerprint: fingerprint,
    provider: limitedString(input.provider, 160),
    confirmationNumber: limitedString(input.confirmationNumber, 120),
    status: "pending-review" as const,
    sourceFilename,
    importedAt:
      requiredString(input.importedAt, 40) ?? new Date().toISOString(),
    approvedAt: null,
    createdAt: null,
    modifiedAt: null,
    travelers: stringList(input.travelers),
    notes: stringList(input.notes),
    source: {
      filename: sourceFilename,
      documentReference: `incoming/${sourceFilename}`,
      fingerprint,
      parserId,
      extractionMethod: safeExtractionMethod,
      classificationConfidence:
        typeof source.classificationConfidence === "number" &&
        Number.isFinite(source.classificationConfidence)
          ? Math.min(1, Math.max(0, source.classificationConfidence))
          : 0,
    },
    evidence: parseEvidence(input.evidence),
    financial: null,
  };
}

export function parseReservationDraft(input: unknown): NormalizedReservation | null {
  if (!isRecord(input)) return null;
  const common = parseCommon(input);
  if (!common) return null;

  if (input.type === "hotel" && isRecord(input.hotel)) {
    const hotel = input.hotel;
    return {
      ...common,
      type: "hotel",
      hotel: {
        propertyName: limitedString(hotel.propertyName),
        address: limitedString(hotel.address),
        city: limitedString(hotel.city),
        country: limitedString(hotel.country),
        checkInDate: limitedString(hotel.checkInDate, 10),
        checkOutDate: limitedString(hotel.checkOutDate, 10),
        checkInTime: limitedString(hotel.checkInTime, 5),
        checkOutTime: limitedString(hotel.checkOutTime, 5),
        accommodationType: limitedString(hotel.accommodationType),
        guestCount: nullableNumber(hotel.guestCount),
        bookingReference: limitedString(hotel.bookingReference, 120),
        contact: limitedString(hotel.contact),
      },
    };
  }

  if (input.type === "rental-car" && isRecord(input.rentalCar)) {
    const car = input.rentalCar;
    return {
      ...common,
      type: "rental-car",
      rentalCar: {
        rentalProvider: limitedString(car.rentalProvider),
        bookingPlatform: limitedString(car.bookingPlatform),
        pickupLocation: limitedString(car.pickupLocation),
        pickupLocalDateTime: limitedString(car.pickupLocalDateTime, 16),
        dropoffLocation: limitedString(car.dropoffLocation),
        dropoffLocalDateTime: limitedString(car.dropoffLocalDateTime, 16),
        timezone: limitedString(car.timezone, 100),
        vehicleCategory: limitedString(car.vehicleCategory),
        primaryDriver: limitedString(car.primaryDriver),
        includedCoverage: stringList(car.includedCoverage, 20),
      },
    };
  }

  if (input.type === "flight" && isRecord(input.flight)) {
    const flight = input.flight;
    const segments = Array.isArray(flight.segments)
      ? flight.segments
          .filter(isRecord)
          .slice(0, 12)
          .map((segment, index) => ({
            id: `segment-${index + 1}`,
            airline: limitedString(segment.airline),
            flightNumber: limitedString(segment.flightNumber, 40),
            departureAirport: limitedString(segment.departureAirport, 100),
            arrivalAirport: limitedString(segment.arrivalAirport, 100),
            departureLocalDateTime: limitedString(
              segment.departureLocalDateTime,
              16,
            ),
            arrivalLocalDateTime: limitedString(segment.arrivalLocalDateTime, 16),
            departureTimezone: limitedString(segment.departureTimezone, 100),
            arrivalTimezone: limitedString(segment.arrivalTimezone, 100),
            cabinClass: limitedString(segment.cabinClass),
            operatingCarrier: limitedString(segment.operatingCarrier),
          }))
      : [];

    return {
      ...common,
      type: "flight",
      flight: {
        airline: limitedString(flight.airline),
        bookingReference: limitedString(flight.bookingReference, 120),
        segments,
      },
    };
  }

  return null;
}

export function parseApprovedReservation(input: unknown): NormalizedReservation | null {
  if (!isRecord(input) || input.status !== "approved") return null;
  const draft = parseReservationDraft({ ...input, status: "pending-review" });
  const approvedAt = requiredString(input.approvedAt, 40);
  const createdAt = requiredString(input.createdAt, 40);
  const modifiedAt = requiredString(input.modifiedAt, 40);

  if (!draft || !approvedAt || !createdAt || !modifiedAt) return null;

  return {
    ...draft,
    status: "approved",
    approvedAt,
    createdAt,
    modifiedAt,
  } as NormalizedReservation;
}
