export const reservationTypes = ["hotel", "rental-car", "flight"] as const;

export type ReservationType = (typeof reservationTypes)[number];
export type ExtractionConfidence =
  | "high"
  | "medium"
  | "low"
  | "not-found";
export type ExtractionMethod = "native-text" | "local-ocr" | "unavailable";
export type EvidenceSource = ExtractionMethod | "user-edited" | "not-found";

export interface FieldEvidence {
  confidence: ExtractionConfidence;
  source: EvidenceSource;
}

export interface ReservationSource {
  filename: string;
  documentReference: string;
  fingerprint: string;
  parserId: string;
  extractionMethod: ExtractionMethod;
  classificationConfidence: number;
}

export interface FinancialDetails {
  currency: string | null;
  totalPrice: number | null;
  taxesAndFees: number | null;
  paymentStatus: string | null;
}

export interface FlightSegment {
  id: string;
  airline: string | null;
  flightNumber: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  departureLocalDateTime: string | null;
  arrivalLocalDateTime: string | null;
  departureTimezone: string | null;
  arrivalTimezone: string | null;
  cabinClass: string | null;
  operatingCarrier: string | null;
}

export interface ReservationBase {
  schemaVersion: 2;
  id: string;
  documentFingerprint: string;
  type: ReservationType;
  provider: string | null;
  confirmationNumber: string | null;
  status: "pending-review" | "approved";
  sourceFilename: string;
  importedAt: string;
  approvedAt: string | null;
  createdAt: string | null;
  modifiedAt: string | null;
  travelers: string[];
  notes: string[];
  source: ReservationSource;
  evidence: Record<string, FieldEvidence>;
  financial: FinancialDetails | null;
}

export interface HotelReservation extends ReservationBase {
  type: "hotel";
  hotel: {
    propertyName: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    checkInDate: string | null;
    checkOutDate: string | null;
    checkInTime: string | null;
    checkOutTime: string | null;
    accommodationType: string | null;
    guestCount: number | null;
    bookingReference: string | null;
    contact: string | null;
  };
}

export interface RentalCarReservation extends ReservationBase {
  type: "rental-car";
  rentalCar: {
    rentalProvider: string | null;
    bookingPlatform: string | null;
    pickupLocation: string | null;
    pickupLocalDateTime: string | null;
    dropoffLocation: string | null;
    dropoffLocalDateTime: string | null;
    timezone: string | null;
    vehicleCategory: string | null;
    primaryDriver: string | null;
    includedCoverage: string[];
  };
}

export interface FlightReservation extends ReservationBase {
  type: "flight";
  flight: {
    airline: string | null;
    bookingReference: string | null;
    segments: FlightSegment[];
  };
}

export type NormalizedReservation =
  | HotelReservation
  | RentalCarReservation
  | FlightReservation;

export type ApprovedReservation = NormalizedReservation & {
  status: "approved";
  approvedAt: string;
  createdAt: string;
  modifiedAt: string;
};

export function reservationIdFromFingerprint(fingerprint: string): string {
  return `reservation-${fingerprint.slice(0, 24)}`;
}
