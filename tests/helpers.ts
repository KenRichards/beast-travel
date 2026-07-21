import type { AnalyzedDocument } from "../src/lib/import/analyzer/types";
import type { DocumentClassification } from "../src/lib/import/classifier";
import type {
  FlightReservation,
  HotelReservation,
  RentalCarReservation,
} from "../src/lib/import/reservation";

export function syntheticAnalysis(
  text: string,
  method: "native-text" | "local-ocr" = "native-text",
): AnalyzedDocument {
  return {
    document: {
      filename: "synthetic-reservation.pdf",
      size: 1_024,
      lastModified: "2030-01-01T00:00:00.000Z",
      extension: ".pdf",
    },
    metadata: {
      filename: "synthetic-reservation.pdf",
      extension: ".pdf",
      mimeType: "application/pdf",
      fileSize: 1_024,
      filesystemModifiedAt: "2030-01-01T00:00:00.000Z",
      sha256: "a".repeat(64),
      pdf: { pageCount: 2 },
    },
    text: {
      status: "extracted",
      method,
      sample: text,
      characterCount: text.length,
      truncated: false,
      pageLimit: 20,
    },
  };
}

export function classification(
  type: "hotel" | "rental-car" | "flight",
  providerId: "booking-com" | "air-canada",
): DocumentClassification {
  return {
    probableType: type,
    probableProvider: {
      id: providerId,
      name: providerId === "booking-com" ? "Booking.com" : "Air Canada",
    },
    confidence: "high",
    confidenceScore: 0.95,
    recognitionStatus: "recognized-supported",
    signals: ["synthetic"],
  };
}

const source = {
  filename: "synthetic-reservation.pdf",
  documentReference: "incoming/synthetic-reservation.pdf",
  fingerprint: "a".repeat(64),
  parserId: "synthetic-v1",
  extractionMethod: "native-text" as const,
  classificationConfidence: 1,
};

const base = {
  schemaVersion: 2 as const,
  id: `reservation-${"a".repeat(24)}`,
  documentFingerprint: "a".repeat(64),
  provider: "Example Provider",
  confirmationNumber: "SYNTH123",
  status: "pending-review" as const,
  sourceFilename: "synthetic-reservation.pdf",
  importedAt: "2030-01-01T00:00:00.000Z",
  approvedAt: null,
  createdAt: null,
  modifiedAt: null,
  travelers: ["Sample Traveler"],
  notes: [],
  source,
  evidence: {},
  financial: null,
};

export function validHotel(): HotelReservation {
  return {
    ...base,
    type: "hotel",
    hotel: {
      propertyName: "Example Hotel",
      address: null,
      city: "Sample City",
      country: "Sample Country",
      checkInDate: "2030-07-10",
      checkOutDate: "2030-07-12",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      accommodationType: "Example room",
      guestCount: 1,
      bookingReference: "SYNTH123",
      contact: null,
    },
  };
}

export function validRentalCar(): RentalCarReservation {
  return {
    ...base,
    type: "rental-car",
    rentalCar: {
      rentalProvider: "Example Rentals",
      bookingPlatform: "Booking Platform",
      pickupLocation: "Sample Airport",
      pickupLocalDateTime: "2030-07-10T10:00",
      dropoffLocation: "Sample Airport",
      dropoffLocalDateTime: "2030-07-12T10:00",
      timezone: "Etc/UTC",
      vehicleCategory: "Example category",
      primaryDriver: "Sample Traveler",
      includedCoverage: ["Example coverage"],
    },
  };
}

export function validFlight(): FlightReservation {
  return {
    ...base,
    type: "flight",
    flight: {
      airline: "Example Air",
      bookingReference: "SYNTH123",
      segments: [
        {
          id: "segment-1",
          airline: "Example Air",
          flightNumber: "EA 100",
          departureAirport: "AAA",
          arrivalAirport: "BBB",
          departureLocalDateTime: "2030-07-10T08:00",
          arrivalLocalDateTime: "2030-07-10T10:00",
          departureTimezone: "Etc/UTC",
          arrivalTimezone: "Etc/UTC",
          cabinClass: "Example cabin",
          operatingCarrier: null,
        },
      ],
    },
  };
}
