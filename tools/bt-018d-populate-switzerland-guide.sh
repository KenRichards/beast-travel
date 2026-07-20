#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

SERVICE="beast-travel"
ITINERARY="src/data/trips/switzerland-2026/itinerary.json"
BACKUP_DIR=".backups/bt-018d-$(date +%Y%m%d-%H%M%S)"

echo "=========================================="
echo " BT-018D — Populate Switzerland Guide"
echo "=========================================="

for required in \
  package.json \
  compose.yaml \
  "$ITINERARY" \
  src/types/itinerary.ts \
  src/components/trip/InteractiveMap.tsx \
  'src/app/trips/[tripId]/day/[day]/page.tsx'
do
  if [[ ! -f "$required" ]]; then
    echo "ERROR: Missing required file: $required"
    exit 1
  fi
done

mkdir -p "$BACKUP_DIR/$(dirname "$ITINERARY")"
cp "$ITINERARY" "$BACKUP_DIR/$ITINERARY"

python3 - <<'PY'
import json
from pathlib import Path

path = Path("src/data/trips/switzerland-2026/itinerary.json")
data = json.loads(path.read_text())

guide_data = {
    1: {
        "map": {
            "center": {
                "latitude": 47.37445,
                "longitude": 8.53975
            },
            "zoom": 14
        },
        "locations": [
            {
                "id": "zurich-hb",
                "name": "Zürich Hauptbahnhof",
                "type": "station",
                "coordinates": {
                    "latitude": 47.37818,
                    "longitude": 8.54019
                },
                "description": "Zürich's central railway station and the primary transit hub for the city.",
                "address": "Bahnhofplatz, 8001 Zürich",
                "durationMinutes": 20,
                "reservationStatus": "not-required",
                "notes": [
                    "Use this station for connections to Lucerne and the airport.",
                    "Confirm the departure platform in the SBB app."
                ]
            },
            {
                "id": "bahnhofstrasse",
                "name": "Bahnhofstrasse",
                "type": "shopping",
                "coordinates": {
                    "latitude": 47.37170,
                    "longitude": 8.53890
                },
                "description": "Central Zürich shopping avenue connecting the main station area with Lake Zürich.",
                "address": "Bahnhofstrasse, 8001 Zürich",
                "durationMinutes": 45,
                "reservationStatus": "not-required"
            },
            {
                "id": "lindenhof",
                "name": "Lindenhof",
                "type": "viewpoint",
                "coordinates": {
                    "latitude": 47.37304,
                    "longitude": 8.54089
                },
                "description": "A peaceful historic hilltop with views over the Limmat River and Zürich's Old Town.",
                "address": "Lindenhof, 8001 Zürich",
                "durationMinutes": 35,
                "reservationStatus": "not-required"
            },
            {
                "id": "niederdorf",
                "name": "Niederdorf and Old Town",
                "type": "attraction",
                "coordinates": {
                    "latitude": 47.37410,
                    "longitude": 8.54460
                },
                "description": "Pedestrian lanes, historic buildings, cafés, shops, and squares in Zürich's Old Town.",
                "address": "Niederdorfstrasse, 8001 Zürich",
                "durationMinutes": 90,
                "reservationStatus": "not-required"
            },
            {
                "id": "buerkliplatz",
                "name": "Bürkliplatz and Lake Zürich",
                "type": "viewpoint",
                "coordinates": {
                    "latitude": 47.36630,
                    "longitude": 8.54125
                },
                "description": "Lakeside promenade and city viewpoint near the southern end of Bahnhofstrasse.",
                "address": "Bürkliplatz, 8001 Zürich",
                "durationMinutes": 45,
                "reservationStatus": "not-required"
            }
        ],
        "schedule": [
            {
                "id": "zurich-arrival",
                "time": "Morning",
                "title": "Arrive and transfer into Zürich",
                "description": "Clear arrival formalities, activate local connectivity, and travel into central Zürich.",
                "locationId": "zurich-hb",
                "transport": "Airport train or local transit",
                "durationMinutes": 90,
                "reservationRequired": False
            },
            {
                "id": "zurich-checkin",
                "time": "Early afternoon",
                "title": "Hotel check-in and reset",
                "description": "Drop luggage, eat something light, and allow time to recover from the overnight flight.",
                "durationMinutes": 90,
                "reservationRequired": False
            },
            {
                "id": "zurich-old-town",
                "time": "Afternoon",
                "title": "Old Town walking loop",
                "description": "Walk through Bahnhofstrasse, Lindenhof, Niederdorf, and the lanes along the Limmat.",
                "locationId": "lindenhof",
                "transport": "Walking",
                "durationMinutes": 150,
                "reservationRequired": False
            },
            {
                "id": "zurich-lake",
                "time": "Evening",
                "title": "Lake Zürich and dinner",
                "description": "Finish near Bürkliplatz and choose dinner based on energy level and weather.",
                "locationId": "buerkliplatz",
                "transport": "Walking or tram",
                "durationMinutes": 120,
                "reservationRequired": False
            }
        ],
        "travelSegments": [
            {
                "id": "airport-to-zurich",
                "from": "Zürich Airport",
                "to": "Zürich Hauptbahnhof",
                "mode": "Train",
                "durationMinutes": 15,
                "notes": [
                    "Check the live SBB schedule after landing.",
                    "Keep passports and valuables accessible during the transfer."
                ]
            }
        ],
        "notes": [
            "Keep arrival day intentionally flexible.",
            "Prioritize hydration, food, and sleep over completing every stop.",
            "Use public transportation if jet lag makes the full walking loop uncomfortable."
        ]
    },
    2: {
        "map": {
            "center": {
                "latitude": 47.05205,
                "longitude": 8.30770
            },
            "zoom": 15
        },
        "locations": [
            {
                "id": "lucerne-station",
                "name": "Lucerne Railway Station",
                "type": "station",
                "coordinates": {
                    "latitude": 47.05015,
                    "longitude": 8.31018
                },
                "description": "The arrival point for the Zürich-to-Lucerne train and an easy starting point for the walking itinerary.",
                "address": "Zentralstrasse 1, 6003 Luzern",
                "durationMinutes": 15,
                "reservationStatus": "not-required"
            },
            {
                "id": "chapel-bridge",
                "name": "Chapel Bridge",
                "type": "attraction",
                "coordinates": {
                    "latitude": 47.05165,
                    "longitude": 8.30748
                },
                "description": "Lucerne's landmark covered wooden bridge and water tower.",
                "address": "Kapellbrücke, 6002 Luzern",
                "durationMinutes": 45,
                "reservationStatus": "not-required"
            },
            {
                "id": "lucerne-old-town",
                "name": "Lucerne Old Town",
                "type": "attraction",
                "coordinates": {
                    "latitude": 47.05290,
                    "longitude": 8.30560
                },
                "description": "Historic squares, decorated façades, pedestrian streets, and shops north of the Reuss River.",
                "address": "Kornmarkt, 6004 Luzern",
                "durationMinutes": 90,
                "reservationStatus": "not-required"
            },
            {
                "id": "lion-monument",
                "name": "Lion Monument",
                "type": "attraction",
                "coordinates": {
                    "latitude": 47.05833,
                    "longitude": 8.31056
                },
                "description": "The Lion of Lucerne rock monument in a small park near the historic center.",
                "address": "Denkmalstrasse 4, 6006 Luzern",
                "durationMinutes": 35,
                "reservationStatus": "not-required"
            },
            {
                "id": "musegg-wall",
                "name": "Musegg Wall",
                "type": "viewpoint",
                "coordinates": {
                    "latitude": 47.05590,
                    "longitude": 8.30275
                },
                "description": "Historic city fortifications and towers overlooking Lucerne.",
                "address": "Auf Musegg, 6004 Luzern",
                "durationMinutes": 75,
                "reservationStatus": "not-required",
                "notes": [
                    "Tower access can be seasonal.",
                    "Skip the climb if weather or mobility makes it uncomfortable."
                ]
            },
            {
                "id": "lucerne-waterfront",
                "name": "Lake Lucerne Waterfront",
                "type": "viewpoint",
                "coordinates": {
                    "latitude": 47.05225,
                    "longitude": 8.31225
                },
                "description": "Promenade with lake, mountain, boat, and city views near the station.",
                "address": "Europaplatz, 6005 Luzern",
                "durationMinutes": 60,
                "reservationStatus": "not-required"
            }
        ],
        "schedule": [
            {
                "id": "lucerne-train",
                "time": "08:30",
                "title": "Train from Zürich to Lucerne",
                "description": "Take a direct morning train and begin the day near Lucerne station.",
                "locationId": "lucerne-station",
                "transport": "SBB train",
                "durationMinutes": 50,
                "reservationRequired": False
            },
            {
                "id": "lucerne-bridge",
                "time": "10:00",
                "title": "Chapel Bridge and Old Town",
                "description": "Cross Chapel Bridge, explore the riverfront, and continue into Lucerne's historic squares.",
                "locationId": "chapel-bridge",
                "transport": "Walking",
                "durationMinutes": 135,
                "reservationRequired": False
            },
            {
                "id": "lucerne-lunch",
                "time": "12:30",
                "title": "Lunch in the Old Town",
                "description": "Choose a restaurant based on weather, menu preferences, and wait time.",
                "locationId": "lucerne-old-town",
                "durationMinutes": 75,
                "reservationRequired": False
            },
            {
                "id": "lucerne-lion",
                "time": "14:00",
                "title": "Lion Monument and optional Musegg Wall",
                "description": "Visit the Lion Monument, then continue to the Musegg Wall if energy and weather allow.",
                "locationId": "lion-monument",
                "transport": "Walking",
                "durationMinutes": 120,
                "reservationRequired": False
            },
            {
                "id": "lucerne-waterfront-evening",
                "time": "16:30",
                "title": "Lakefront and return to Zürich",
                "description": "Relax by the waterfront before returning to Zürich by train.",
                "locationId": "lucerne-waterfront",
                "transport": "Walking and train",
                "durationMinutes": 120,
                "reservationRequired": False
            }
        ],
        "travelSegments": [
            {
                "id": "zurich-to-lucerne",
                "from": "Zürich Hauptbahnhof",
                "to": "Lucerne Railway Station",
                "mode": "Train",
                "durationMinutes": 50,
                "notes": [
                    "Confirm the live departure and platform in the SBB app.",
                    "Return timing can remain flexible unless another reservation requires a specific train."
                ]
            }
        ],
        "notes": [
            "Most central Lucerne stops can be connected on foot.",
            "The Musegg Wall adds elevation and stairs; treat it as optional.",
            "Leave flexibility for a lake cruise if weather and timing are favorable."
        ]
    },
    3: {
        "map": {
            "center": {
                "latitude": 46.62425,
                "longitude": 8.04140
            },
            "zoom": 14
        },
        "locations": [
            {
                "id": "grindelwald-station",
                "name": "Grindelwald Railway Station",
                "type": "station",
                "coordinates": {
                    "latitude": 46.62427,
                    "longitude": 8.03345
                },
                "description": "Central village railway station and arrival point for the traditional rail route.",
                "address": "Dorfstrasse 75, 3818 Grindelwald",
                "durationMinutes": 20,
                "reservationStatus": "not-required"
            },
            {
                "id": "grindelwald-terminal",
                "name": "Grindelwald Terminal",
                "type": "transport",
                "coordinates": {
                    "latitude": 46.62455,
                    "longitude": 8.01830
                },
                "description": "Transport hub providing access to the Eiger Express and mountain connections.",
                "address": "Grundstrasse 54, 3818 Grindelwald",
                "durationMinutes": 45,
                "reservationStatus": "not-required"
            },
            {
                "id": "grindelwald-village",
                "name": "Grindelwald Village Center",
                "type": "attraction",
                "coordinates": {
                    "latitude": 46.62440,
                    "longitude": 8.04120
                },
                "description": "Alpine village center with shops, restaurants, hotels, and views toward the Eiger.",
                "address": "Dorfstrasse, 3818 Grindelwald",
                "durationMinutes": 120,
                "reservationStatus": "not-required"
            },
            {
                "id": "firstbahn",
                "name": "Grindelwald-First Gondola Station",
                "type": "transport",
                "coordinates": {
                    "latitude": 46.62582,
                    "longitude": 8.04245
                },
                "description": "Valley gondola station for Grindelwald-First mountain excursions.",
                "address": "Dorfstrasse 187, 3818 Grindelwald",
                "durationMinutes": 30,
                "reservationStatus": "recommended"
            },
            {
                "id": "first-cliff-walk",
                "name": "First Cliff Walk",
                "type": "viewpoint",
                "coordinates": {
                    "latitude": 46.66020,
                    "longitude": 8.05455
                },
                "description": "Mountain walkway and viewing platform reached from Grindelwald-First.",
                "address": "First, 3818 Grindelwald",
                "durationMinutes": 75,
                "reservationStatus": "recommended",
                "notes": [
                    "Mountain operations are weather-dependent.",
                    "Confirm operating status before leaving the village."
                ]
            }
        ],
        "schedule": [
            {
                "id": "grindelwald-departure",
                "time": "Morning",
                "title": "Travel into the Bernese Oberland",
                "description": "Depart Zürich and travel through the Interlaken region toward Grindelwald.",
                "locationId": "grindelwald-station",
                "transport": "SBB and regional trains",
                "durationMinutes": 165,
                "reservationRequired": False
            },
            {
                "id": "grindelwald-arrival",
                "time": "Early afternoon",
                "title": "Arrive and settle in",
                "description": "Check in or store luggage, then orient around the village and transportation hubs.",
                "locationId": "grindelwald-village",
                "transport": "Walking or local bus",
                "durationMinutes": 90,
                "reservationRequired": False
            },
            {
                "id": "grindelwald-explore",
                "time": "Afternoon",
                "title": "Explore Grindelwald",
                "description": "Walk through the village, visit viewpoints, and confirm the next day's Jungfraujoch route.",
                "locationId": "grindelwald-village",
                "transport": "Walking",
                "durationMinutes": 150,
                "reservationRequired": False
            },
            {
                "id": "grindelwald-first-option",
                "time": "Weather option",
                "title": "Optional Grindelwald-First excursion",
                "description": "Use the First gondola and Cliff Walk only if arrival time, visibility, and operating conditions make it practical.",
                "locationId": "firstbahn",
                "transport": "Gondola",
                "durationMinutes": 180,
                "reservationRequired": True
            }
        ],
        "travelSegments": [
            {
                "id": "zurich-to-grindelwald",
                "from": "Zürich Hauptbahnhof",
                "to": "Grindelwald",
                "mode": "Train",
                "durationMinutes": 165,
                "notes": [
                    "The exact connection may require transfers.",
                    "Check live routing and platform information in the SBB app."
                ]
            }
        ],
        "notes": [
            "Mountain visibility should determine whether Grindelwald-First is attempted.",
            "Preserve enough energy for the Jungfraujoch excursion the following day.",
            "Confirm breakfast or early-food options for the next morning."
        ]
    },
    4: {
        "map": {
            "center": {
                "latitude": 46.58810,
                "longitude": 8.00710
            },
            "zoom": 11
        },
        "locations": [
            {
                "id": "grindelwald-terminal-jungfrau",
                "name": "Grindelwald Terminal",
                "type": "station",
                "coordinates": {
                    "latitude": 46.62455,
                    "longitude": 8.01830
                },
                "description": "Starting point for the Eiger Express route toward Jungfraujoch.",
                "address": "Grundstrasse 54, 3818 Grindelwald",
                "durationMinutes": 30,
                "reservationStatus": "confirmed"
            },
            {
                "id": "eiger-express",
                "name": "Eiger Express",
                "type": "transport",
                "coordinates": {
                    "latitude": 46.60940,
                    "longitude": 8.01140
                },
                "description": "Gondola connection between Grindelwald Terminal and Eigergletscher.",
                "durationMinutes": 15,
                "reservationStatus": "confirmed"
            },
            {
                "id": "eigergletscher",
                "name": "Eigergletscher Station",
                "type": "station",
                "coordinates": {
                    "latitude": 46.57425,
                    "longitude": 7.97435
                },
                "description": "Transfer point between the Eiger Express and the Jungfrau Railway.",
                "durationMinutes": 25,
                "reservationStatus": "confirmed"
            },
            {
                "id": "jungfraujoch-station",
                "name": "Jungfraujoch Railway Station",
                "type": "station",
                "coordinates": {
                    "latitude": 46.54742,
                    "longitude": 7.98210
                },
                "description": "High-altitude rail arrival point for the Jungfraujoch complex.",
                "durationMinutes": 20,
                "reservationStatus": "confirmed"
            },
            {
                "id": "sphinx-observatory",
                "name": "Sphinx Observatory",
                "type": "viewpoint",
                "coordinates": {
                    "latitude": 46.54750,
                    "longitude": 7.98530
                },
                "description": "High-altitude viewing terraces overlooking glaciers and surrounding peaks.",
                "durationMinutes": 60,
                "reservationStatus": "confirmed"
            },
            {
                "id": "ice-palace",
                "name": "Ice Palace",
                "type": "attraction",
                "coordinates": {
                    "latitude": 46.54720,
                    "longitude": 7.98425
                },
                "description": "Indoor passage through ice features within the Jungfraujoch visitor complex.",
                "durationMinutes": 45,
                "reservationStatus": "confirmed"
            },
            {
                "id": "alpine-sensation",
                "name": "Alpine Sensation",
                "type": "attraction",
                "coordinates": {
                    "latitude": 46.54730,
                    "longitude": 7.98330
                },
                "description": "Indoor exhibition connecting the station, Ice Palace, and Sphinx areas.",
                "durationMinutes": 35,
                "reservationStatus": "confirmed"
            }
        ],
        "schedule": [
            {
                "id": "jungfrau-terminal",
                "time": "Early morning",
                "title": "Arrive at Grindelwald Terminal",
                "description": "Arrive before the reserved connection, verify tickets, and follow signs for the Eiger Express.",
                "locationId": "grindelwald-terminal-jungfrau",
                "transport": "Train, bus, or local connection",
                "durationMinutes": 45,
                "reservationRequired": True
            },
            {
                "id": "jungfrau-eiger-express",
                "time": "Morning",
                "title": "Eiger Express to Eigergletscher",
                "description": "Ride the gondola to Eigergletscher and transfer to the Jungfrau Railway.",
                "locationId": "eiger-express",
                "transport": "Gondola",
                "durationMinutes": 40,
                "reservationRequired": True
            },
            {
                "id": "jungfrau-ascent",
                "time": "Morning",
                "title": "Jungfrau Railway ascent",
                "description": "Continue by cogwheel railway from Eigergletscher to Jungfraujoch.",
                "locationId": "eigergletscher",
                "transport": "Cogwheel railway",
                "durationMinutes": 35,
                "reservationRequired": True
            },
            {
                "id": "jungfrau-complex",
                "time": "Late morning",
                "title": "Explore Jungfraujoch",
                "description": "Visit the Sphinx terraces, Alpine Sensation, Ice Palace, and indoor visitor areas.",
                "locationId": "sphinx-observatory",
                "transport": "Walking and elevators",
                "durationMinutes": 180,
                "reservationRequired": True
            },
            {
                "id": "jungfrau-return",
                "time": "Afternoon",
                "title": "Return to Grindelwald",
                "description": "Retrace the railway and Eiger Express route, allowing time for transfers and weather delays.",
                "locationId": "jungfraujoch-station",
                "transport": "Railway and gondola",
                "durationMinutes": 90,
                "reservationRequired": True
            }
        ],
        "travelSegments": [
            {
                "id": "terminal-to-eigergletscher",
                "from": "Grindelwald Terminal",
                "to": "Eigergletscher",
                "mode": "Eiger Express",
                "durationMinutes": 15,
                "notes": [
                    "Follow the live operating information and reservation instructions.",
                    "Board only the connection matching the ticket or seat reservation."
                ]
            },
            {
                "id": "eigergletscher-to-jungfraujoch",
                "from": "Eigergletscher",
                "to": "Jungfraujoch",
                "mode": "Jungfrau Railway",
                "durationMinutes": 30,
                "notes": [
                    "Allow time to find the correct transfer platform.",
                    "Keep tickets accessible throughout the journey."
                ]
            }
        ],
        "notes": [
            "Check operating status, mountain weather, and visibility before departure.",
            "Bring layers, sunglasses, sunscreen, water, and appropriate footwear.",
            "Move slowly at altitude and take breaks if anyone develops headache, dizziness, nausea, or unusual shortness of breath.",
            "Do not force outdoor snow activities if visibility or conditions are poor."
        ]
    }
}

days_by_number = {day["day"]: day for day in data["days"]}

for day_number, additions in guide_data.items():
    if day_number not in days_by_number:
        raise SystemExit(f"Missing itinerary day {day_number}")

    days_by_number[day_number].update(additions)

path.write_text(
    json.dumps(data, indent=2, ensure_ascii=False) + "\n"
)

print("Populated Switzerland guide data.")
PY

echo
echo "Validating JSON..."
python3 -m json.tool "$ITINERARY" >/dev/null

python3 - <<'PY'
import json
from pathlib import Path

path = Path("src/data/trips/switzerland-2026/itinerary.json")
data = json.loads(path.read_text())

expected_counts = {
    1: 5,
    2: 6,
    3: 5,
    4: 7,
}

valid_types = {
    "attraction",
    "restaurant",
    "cafe",
    "hotel",
    "station",
    "transport",
    "viewpoint",
    "shopping",
    "parking",
    "other",
}

all_ids = set()

for day in data["days"]:
    day_number = day["day"]
    locations = day["locations"]

    expected = expected_counts[day_number]
    actual = len(locations)

    if actual != expected:
        raise SystemExit(
            f"Day {day_number}: expected {expected} locations; found {actual}"
        )

    if not day["schedule"]:
        raise SystemExit(f"Day {day_number}: schedule is empty")

    if not day["travelSegments"]:
        raise SystemExit(f"Day {day_number}: travelSegments is empty")

    for location in locations:
        location_id = location["id"]

        if location_id in all_ids:
            raise SystemExit(f"Duplicate location id: {location_id}")

        all_ids.add(location_id)

        if location["type"] not in valid_types:
            raise SystemExit(
                f"Invalid location type: {location['type']}"
            )

        latitude = location["coordinates"]["latitude"]
        longitude = location["coordinates"]["longitude"]

        if not (-90 <= latitude <= 90):
            raise SystemExit(
                f"Invalid latitude for {location_id}: {latitude}"
            )

        if not (-180 <= longitude <= 180):
            raise SystemExit(
                f"Invalid longitude for {location_id}: {longitude}"
            )

    location_ids = {location["id"] for location in locations}

    for item in day["schedule"]:
        referenced = item.get("locationId")

        if referenced and referenced not in location_ids:
            raise SystemExit(
                f"Day {day_number} schedule references "
                f"unknown location: {referenced}"
            )

print(
    "Guide validation passed: "
    f"{len(all_ids)} mapped locations across {len(data['days'])} days."
)
PY

echo
echo "Checking TypeScript..."
docker compose exec -T "$SERVICE" npx tsc --noEmit

echo
echo "Running production build..."
docker compose exec -T "$SERVICE" npm run build

echo
echo "Restarting development runtime..."
docker compose down
rm -rf .next
docker compose up -d --force-recreate

echo
echo "Waiting for application..."

READY=0

for attempt in $(seq 1 40); do
  CODE="$(
    curl -sS -o /dev/null -w '%{http_code}' \
      http://127.0.0.1:3005/trips/switzerland-2026/day/1 \
      2>/dev/null || true
  )"

  if [[ "$CODE" == "200" ]]; then
    READY=1
    echo "Application ready."
    break
  fi

  printf '.'
  sleep 2
done

echo

if [[ "$READY" -ne 1 ]]; then
  echo "ERROR: Application did not become ready."
  docker compose logs --tail=180 "$SERVICE"
  exit 1
fi

echo
echo "Checking all itinerary routes..."

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
echo "Checking mapped-location counts..."

python3 - <<'PY'
import json
from pathlib import Path

data = json.loads(
    Path(
        "src/data/trips/switzerland-2026/itinerary.json"
    ).read_text()
)

for day in data["days"]:
    print(
        f"Day {day['day']}: "
        f"{len(day['locations'])} locations, "
        f"{len(day['schedule'])} schedule items"
    )
PY

echo
echo "Checking recent errors..."

if docker compose logs --since=3m "$SERVICE" 2>&1 |
  grep -E \
    'Module not found|TypeError|ReferenceError|SyntaxError|window is not defined|⨯'
then
  echo
  echo "ERROR: Recent application errors detected."
  exit 1
else
  echo "No recent application errors."
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo "ERROR: One or more itinerary pages failed."
  exit 1
fi

echo
echo "BT-018D installed successfully."
echo "Backup: $BACKUP_DIR"
echo
echo "Review:"
echo "  http://192.168.86.61:3005/trips/switzerland-2026/day/1"
echo "  http://192.168.86.61:3005/trips/switzerland-2026/day/2"
echo "  http://192.168.86.61:3005/trips/switzerland-2026/day/3"
echo "  http://192.168.86.61:3005/trips/switzerland-2026/day/4"
