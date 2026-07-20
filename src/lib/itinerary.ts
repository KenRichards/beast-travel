import itinerary from "@/data/trips/switzerland-2026/itinerary.json";
import type { Itinerary } from "@/types/itinerary";

export function getItinerary(): Itinerary {
  return itinerary as Itinerary;
}
