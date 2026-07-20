export interface ItineraryDay {
  day: number;
  title: string;
  icon: string;
  location: string;
  image: string;
  transport: string;
  travelTime: string;
  budget: number;
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
