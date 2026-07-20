#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================="
echo " BT-018A — Travel Guide Data Model"
echo "=========================================="

ITINERARY_FILE="src/data/trips/switzerland-2026/itinerary.json"
TYPE_FILE="src/types/itinerary.ts"
LIB_FILE="src/lib/itinerary.ts"
BACKUP_DIR=".backups/bt-018a-$(date +%Y%m%d-%H%M%S)"

for required in package.json "$ITINERARY_FILE" "$TYPE_FILE"; do
  if [[ ! -f "$required" ]]; then
    echo "ERROR: Required file not found: $required"
    exit 1
  fi
done

mkdir -p \
  "$BACKUP_DIR/src/data/trips/switzerland-2026" \
  "$BACKUP_DIR/src/types" \
  "$BACKUP_DIR/src/lib"

cp "$ITINERARY_FILE" \
  "$BACKUP_DIR/src/data/trips/switzerland-2026/itinerary.json"

cp "$TYPE_FILE" \
  "$BACKUP_DIR/src/types/itinerary.ts"

if [[ -f "$LIB_FILE" ]]; then
  cp "$LIB_FILE" "$BACKUP_DIR/src/lib/itinerary.ts"
fi

cat > "$TYPE_FILE" <<'EOF'
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
}
EOF

cat > "$ITINERARY_FILE" <<'EOF'
{
  "trip": {
    "id": "switzerland-2026",
    "title": "Switzerland Family Adventure",
    "subtitle": "July 22–29, 2026",
    "heroImage": "/images/switzerland-hero.jpg",
    "startDate": "2026-07-22",
    "endDate": "2026-07-29",
    "travelers": 3,
    "currency": "CHF",
    "timezone": "Europe/Zurich"
  },
  "days": [
    {
      "day": 1,
      "date": "2026-07-22",
      "title": "Arrive in Zürich",
      "icon": "✈️",
      "location": "Zürich",
      "image": "/images/destinations/zurich.jpg",
      "transport": "Flight and local transit",
      "travelTime": "Arrival day",
      "budget": 250,
      "description": "Arrive in Switzerland, check into the hotel, explore Zürich's Altstadt, and enjoy dinner along the Limmat.",
      "map": {
        "center": {
          "latitude": 47.3769,
          "longitude": 8.5417
        },
        "zoom": 13
      },
      "locations": [],
      "schedule": [],
      "travelSegments": [],
      "dailyBudget": {
        "transportation": 40,
        "attractions": 20,
        "food": 140,
        "lodging": 0,
        "miscellaneous": 50,
        "total": 250,
        "currency": "CHF"
      },
      "notes": []
    },
    {
      "day": 2,
      "date": "2026-07-23",
      "title": "Lucerne",
      "icon": "🚞",
      "location": "Lucerne",
      "image": "/images/destinations/lucerne.jpg",
      "transport": "Train",
      "travelTime": "About 50 minutes",
      "budget": 180,
      "description": "Visit Chapel Bridge, explore the historic old town, see the Lion Monument, and enjoy the Lake Lucerne waterfront.",
      "map": {
        "center": {
          "latitude": 47.0502,
          "longitude": 8.3093
        },
        "zoom": 13
      },
      "locations": [],
      "schedule": [],
      "travelSegments": [],
      "dailyBudget": {
        "transportation": 50,
        "attractions": 25,
        "food": 85,
        "lodging": 0,
        "miscellaneous": 20,
        "total": 180,
        "currency": "CHF"
      },
      "notes": []
    },
    {
      "day": 3,
      "date": "2026-07-24",
      "title": "Grindelwald",
      "icon": "🏔️",
      "location": "Grindelwald",
      "image": "/images/destinations/grindelwald.jpg",
      "transport": "Train",
      "travelTime": "About 2 hours 45 minutes",
      "budget": 260,
      "description": "Travel into the Bernese Oberland, settle into Grindelwald, and explore the alpine village beneath the Eiger.",
      "map": {
        "center": {
          "latitude": 46.6242,
          "longitude": 8.0414
        },
        "zoom": 13
      },
      "locations": [],
      "schedule": [],
      "travelSegments": [],
      "dailyBudget": {
        "transportation": 90,
        "attractions": 45,
        "food": 95,
        "lodging": 0,
        "miscellaneous": 30,
        "total": 260,
        "currency": "CHF"
      },
      "notes": []
    },
    {
      "day": 4,
      "date": "2026-07-25",
      "title": "Jungfraujoch",
      "icon": "🚠",
      "location": "Jungfraujoch",
      "image": "/images/destinations/jungfraujoch.jpg",
      "transport": "Train and gondola",
      "travelTime": "Full-day excursion",
      "budget": 420,
      "description": "Journey to the Top of Europe, visit the Sphinx Observatory and Ice Palace, and experience the high-Alpine scenery.",
      "map": {
        "center": {
          "latitude": 46.5475,
          "longitude": 7.9853
        },
        "zoom": 12
      },
      "locations": [],
      "schedule": [],
      "travelSegments": [],
      "dailyBudget": {
        "transportation": 250,
        "attractions": 50,
        "food": 90,
        "lodging": 0,
        "miscellaneous": 30,
        "total": 420,
        "currency": "CHF"
      },
      "notes": []
    }
  ]
}
EOF

cat > "$LIB_FILE" <<'EOF'
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
EOF

echo
echo "Validating itinerary JSON..."

python3 -m json.tool "$ITINERARY_FILE" >/dev/null

python3 - <<'PY'
import json
from pathlib import Path

path = Path("src/data/trips/switzerland-2026/itinerary.json")
data = json.loads(path.read_text())

required_trip_fields = {
    "id",
    "title",
    "subtitle",
    "heroImage",
    "startDate",
    "endDate",
    "travelers",
    "currency",
    "timezone",
}

required_day_fields = {
    "day",
    "date",
    "title",
    "icon",
    "location",
    "image",
    "transport",
    "travelTime",
    "budget",
    "description",
    "map",
    "locations",
    "schedule",
    "travelSegments",
    "dailyBudget",
    "notes",
}

missing_trip = required_trip_fields - set(data["trip"])
if missing_trip:
    raise SystemExit(
        f"Trip metadata missing fields: {sorted(missing_trip)}"
    )

days = data.get("days", [])

if len(days) != 4:
    raise SystemExit(f"Expected 4 itinerary days; found {len(days)}")

for day in days:
    missing = required_day_fields - set(day)
    if missing:
        raise SystemExit(
            f"Day {day.get('day')} missing fields: {sorted(missing)}"
        )

    center = day["map"]["center"]

    if not isinstance(center["latitude"], (int, float)):
        raise SystemExit(f"Day {day['day']} has invalid latitude")

    if not isinstance(center["longitude"], (int, float)):
        raise SystemExit(f"Day {day['day']} has invalid longitude")

    if day["dailyBudget"]["total"] != day["budget"]:
        raise SystemExit(
            f"Day {day['day']} budget total does not match card budget"
        )

print("Travel data model validation passed.")
PY

echo
echo "Waiting for Next.js to reload..."
sleep 3

FAILED=0

for day in 1 2 3 4; do
  URL="http://127.0.0.1:3005/trips/switzerland-2026/day/${day}"
  CODE="$(curl -sS -o /dev/null -w '%{http_code}' "$URL" || true)"

  echo "Day ${day}: HTTP ${CODE}"

  if [[ "$CODE" != "200" ]]; then
    FAILED=1
  fi
done

echo

if docker compose logs --since=2m beast-travel 2>&1 |
  grep -E 'Module not found|TypeError|ReferenceError|SyntaxError|⨯'
then
  echo
  echo "ERROR: Recent application errors detected."
  exit 1
else
  echo "No recent application errors."
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo
  echo "ERROR: One or more itinerary routes failed."
  exit 1
fi

echo
echo "BT-018A installed successfully."
echo "Backup: $BACKUP_DIR"
