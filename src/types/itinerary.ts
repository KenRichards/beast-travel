export interface ItineraryDay {
  day: number;
  title: string;
  icon: string;
  location: string;
  description: string;
}

export interface TripInfo {
  id: string;
  title: string;
  subtitle: string;
  heroImage: string;
}

export interface Itinerary {
  trip: TripInfo;
  days: ItineraryDay[];
}
