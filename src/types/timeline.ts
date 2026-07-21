import type { LogisticsStatus, ReservationType } from "@/types/logistics";

export type TimelineEventKind =
  | "flight"
  | "accommodation-check-in"
  | "accommodation-check-out"
  | "rental-car-pickup"
  | "rental-car-return"
  | "activity"
  | "transportation"
  | "reservation";

export type TimelineEventSource = "itinerary" | "manual" | "imported";
export type TimelineTimePrecision = "exact" | "approximate" | "date-only";

export interface TimelineSourceLink {
  id: string;
  href: string;
  label: string;
  recordType: "itinerary-day" | "trip-logistics" | "reservation";
}

export interface TimelineEvent {
  id: string;
  tripId: string;
  kind: TimelineEventKind;
  reservationType?: ReservationType;
  title: string;
  description?: string;
  date: string;
  time?: string;
  endDate?: string;
  endTime?: string;
  timeLabel: string;
  timePrecision: TimelineTimePrecision;
  sortMinute: number;
  epochMs?: number;
  location?: string;
  provider?: string;
  transport?: string;
  confirmationReference?: string;
  source: TimelineEventSource;
  sourceLink: TimelineSourceLink;
}

export interface TimelineDay {
  date: string;
  events: TimelineEvent[];
}

export interface TimelineLodging {
  id: string;
  name: string;
  city: string;
  address?: string;
  checkInDate: string;
  checkOutDate: string;
  confirmationReference?: string;
  status: LogisticsStatus;
  source: "manual" | "imported";
  reservationHref?: string;
}

export type TripPhase = "before-trip" | "during-trip" | "after-trip";

export interface TodayDashboard {
  phase: TripPhase;
  date: string;
  tripDayNumber?: number;
  tripDayTitle?: string;
  currentLodging?: TimelineLodging;
  nextEvent?: TimelineEvent;
  upcomingEvents: TimelineEvent[];
  transportationEvents: TimelineEvent[];
}
