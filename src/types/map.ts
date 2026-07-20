import type {
  GeographicPoint,
  LocationType,
  TripLocation,
} from "@/types/itinerary";

export interface MapMarker {
  id: string;
  name: string;
  type: LocationType;
  coordinates: GeographicPoint;
  description?: string;
  address?: string;
}

export interface InteractiveMapProps {
  center: GeographicPoint;
  zoom: number;
  locations: TripLocation[] | MapMarker[];
  className?: string;
  height?: string;
  showAttribution?: boolean;
}
