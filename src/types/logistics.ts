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
