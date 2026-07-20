import itinerary from "@/data/trips/switzerland-2026/itinerary.json";
import type {
  Itinerary,
  ItineraryDay,
  TripLocation,
} from "@/types/itinerary";

export function getItinerary(): Itinerary {
  return itinerary as Itinerary;
}

export function getItineraryDay(
  tripId: string,
  dayNumber: number,
): ItineraryDay | undefined {
  const trip = getItinerary();

  if (trip.trip.id !== tripId) {
    return undefined;
  }

  return trip.days.find((day) => day.day === dayNumber);
}

export function getTripLocations(): TripLocation[] {
  return getItinerary().days.flatMap((day) => day.locations);
}

export function getDayLocation(
  tripId: string,
  dayNumber: number,
  locationId: string,
): TripLocation | undefined {
  return getItineraryDay(tripId, dayNumber)?.locations.find(
    (location) => location.id === locationId,
  );
}
