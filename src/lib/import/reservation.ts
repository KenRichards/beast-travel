export const reservationTypes = ["hotel", "rental-car", "flight"] as const;

export type ReservationType = (typeof reservationTypes)[number];

export type ParsedFieldValue = string | number | boolean | string[] | null;

export interface ReservationDates {
  start: string;
  end: string;
  timeZone: string;
}

export interface Traveler {
  firstName: string;
  lastName: string;
  role?: string;
}

export interface ReservationLocation {
  name: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  iataCode?: string;
}

export interface ReservationSource {
  filename: string;
  size: number;
  lastModified: string;
  parserId: string;
  classificationConfidence: number;
}

interface BaseReservation {
  schemaVersion: 1;
  provider: string;
  confirmationNumber: string;
  dates: ReservationDates;
  travelers: Traveler[];
  location: ReservationLocation;
  parsedFields: Record<string, ParsedFieldValue>;
  source: ReservationSource;
}

export interface HotelReservation extends BaseReservation {
  type: "hotel";
  hotel: {
    propertyName: string;
    roomType: string;
    nights: number;
  };
}

export interface RentalCarReservation extends BaseReservation {
  type: "rental-car";
  rentalCar: {
    company: string;
    pickupLocation: string;
    dropoffLocation: string;
    vehicleClass: string;
  };
}

export interface FlightReservation extends BaseReservation {
  type: "flight";
  flight: {
    airline: string;
    flightNumber: string;
    departureAirport: string;
    arrivalAirport: string;
  };
}

export type NormalizedReservation =
  | HotelReservation
  | RentalCarReservation
  | FlightReservation;
