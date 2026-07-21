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

export type LogisticsStatus =
  | "not-started"
  | "researching"
  | "planned"
  | "reserved"
  | "confirmed"
  | "completed"
  | "cancelled";

export type ReservationType =
  | "flight"
  | "hotel"
  | "train"
  | "attraction"
  | "restaurant"
  | "rental-car"
  | "transfer"
  | "insurance"
  | "other";

export interface ReservationContact {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface TripReservation {
  id: string;
  type: ReservationType;
  title: string;
  provider?: string;
  status: LogisticsStatus;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  confirmationReference?: string;
  bookingUrl?: string;
  cost?: number;
  currency?: string;
  travelers?: number;
  cancellationDeadline?: string;
  contact?: ReservationContact;
  notes?: string[];
}

export interface Accommodation {
  id: string;
  name: string;
  city: string;
  status: LogisticsStatus;
  checkInDate: string;
  checkOutDate: string;
  address?: string;
  confirmationReference?: string;
  bookingUrl?: string;
  nightlyRate?: number;
  totalCost?: number;
  currency?: string;
  contact?: ReservationContact;
  amenities?: string[];
  notes?: string[];
}

export interface TravelDocument {
  id: string;
  title: string;
  type:
    | "passport"
    | "ticket"
    | "insurance"
    | "reservation"
    | "medical"
    | "emergency"
    | "other";
  status: LogisticsStatus;
  traveler?: string;
  expiresOn?: string;
  reference?: string;
  storageLocation?: string;
  notes?: string[];
}

export interface LogisticsChecklistItem {
  id: string;
  title: string;
  category:
    | "documents"
    | "money"
    | "connectivity"
    | "transportation"
    | "lodging"
    | "packing"
    | "health"
    | "home"
    | "other";
  status: LogisticsStatus;
  dueDate?: string;
  notes?: string[];
}

export interface TripLogistics {
  accommodations: Accommodation[];
  reservations: TripReservation[];
  documents: TravelDocument[];
  checklist: LogisticsChecklistItem[];
  emergencyNotes: string[];
}
