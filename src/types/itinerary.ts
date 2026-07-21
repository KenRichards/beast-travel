import type { TripLogistics } from "@/types/logistics";

export type LocationType =
  | "attraction"
  | "restaurant"
  | "cafe"
  | "hotel"
  | "station"
  | "transport"
  | "viewpoint"
  | "shopping"
  | "parking"
  | "other";

export type ReservationStatus =
  | "not-required"
  | "recommended"
  | "planned"
  | "reserved"
  | "confirmed";

export interface GeographicPoint {
  latitude: number;
  longitude: number;
}

export interface MapConfiguration {
  center: GeographicPoint;
  zoom: number;
}

export interface TripLocation {
  id: string;
  name: string;
  type: LocationType;
  coordinates: GeographicPoint;
  description: string;
  address?: string;
  website?: string;
  durationMinutes?: number;
  priceEstimate?: number;
  reservationStatus?: ReservationStatus;
  reservationReference?: string;
  notes?: string[];
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
  locationId?: string;
  transport?: string;
  durationMinutes?: number;
  reservationRequired?: boolean;
}

export interface TravelSegment {
  id: string;
  from: string;
  to: string;
  mode: string;
  departureTime?: string;
  arrivalTime?: string;
  durationMinutes?: number;
  notes?: string[];
}

export interface DailyBudget {
  transportation: number;
  attractions: number;
  food: number;
  lodging: number;
  miscellaneous: number;
  total: number;
  currency: string;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  icon: string;
  location: string;
  image: string;
  transport: string;
  travelTime: string;
  budget: number;
  description: string;
  map: MapConfiguration;
  locations: TripLocation[];
  schedule: ScheduleItem[];
  travelSegments: TravelSegment[];
  dailyBudget: DailyBudget;
  notes: string[];
}

export interface TripDetails {
  id: string;
  title: string;
  subtitle: string;
  heroImage: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  currency?: string;
  timezone?: string;
}

export interface Itinerary {
  trip: TripDetails;
  days: ItineraryDay[];
  logistics: TripLogistics;
}
