#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================="
echo " BT-018B — Reusable Interactive Map"
echo "=========================================="

SERVICE="beast-travel"
LAYOUT_FILE="src/app/layout.tsx"
MAP_TYPES_FILE="src/types/map.ts"
MAP_WRAPPER_FILE="src/components/trip/InteractiveMap.tsx"
MAP_CLIENT_FILE="src/components/trip/InteractiveMapClient.tsx"
MAP_TEST_PAGE="src/app/map-test/page.tsx"
BACKUP_DIR=".backups/bt-018b-$(date +%Y%m%d-%H%M%S)"

for required in \
  package.json \
  compose.yaml \
  "$LAYOUT_FILE" \
  src/types/itinerary.ts \
  src/lib/itinerary.ts
do
  if [[ ! -f "$required" ]]; then
    echo "ERROR: Required file not found: $required"
    exit 1
  fi
done

if ! docker compose ps --services --status running |
  grep -qx "$SERVICE"
then
  echo "ERROR: Docker Compose service '$SERVICE' is not running."
  echo "Start it with:"
  echo "  docker compose up -d"
  exit 1
fi

mkdir -p \
  "$BACKUP_DIR/src/app" \
  "$BACKUP_DIR/src/types" \
  "$BACKUP_DIR/src/components/trip" \
  "$BACKUP_DIR/src/app/map-test" \
  src/types \
  src/components/trip \
  src/app/map-test

for file in \
  package.json \
  package-lock.json \
  "$LAYOUT_FILE" \
  "$MAP_TYPES_FILE" \
  "$MAP_WRAPPER_FILE" \
  "$MAP_CLIENT_FILE" \
  "$MAP_TEST_PAGE"
do
  if [[ -f "$file" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$file" "$BACKUP_DIR/$file"
  fi
done

echo
echo "Installing Leaflet dependencies through the application container..."

docker compose exec -T "$SERVICE" \
  npm install leaflet react-leaflet

docker compose exec -T "$SERVICE" \
  npm install --save-dev @types/leaflet

echo
echo "Adding Leaflet CSS to the root application layout..."

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/layout.tsx")
text = path.read_text()

import_line = 'import "leaflet/dist/leaflet.css";'

if import_line in text:
    print("Leaflet CSS import already present.")
else:
    lines = text.splitlines()

    insertion_index = 0
    for index, line in enumerate(lines):
        if line.startswith("import "):
            insertion_index = index + 1

    lines.insert(insertion_index, import_line)
    path.write_text("\n".join(lines) + "\n")
    print("Added Leaflet CSS import.")
PY

cat > "$MAP_TYPES_FILE" <<'EOF'
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
EOF

cat > "$MAP_WRAPPER_FILE" <<'EOF'
"use client";

import dynamic from "next/dynamic";

import type { InteractiveMapProps } from "@/types/map";

const InteractiveMapClient = dynamic(
  () => import("@/components/trip/InteractiveMapClient"),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Loading interactive map"
        className="
          flex min-h-[420px] items-center justify-center
          rounded-3xl border border-white/10 bg-white/5
          text-sm font-semibold text-gray-400
        "
      >
        Loading map…
      </div>
    ),
  },
);

export default function InteractiveMap(props: InteractiveMapProps) {
  return <InteractiveMapClient {...props} />;
}
EOF

cat > "$MAP_CLIENT_FILE" <<'EOF'
"use client";

import { divIcon, type LatLngExpression } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
} from "react-leaflet";

import type { LocationType } from "@/types/itinerary";
import type {
  InteractiveMapProps,
  MapMarker,
} from "@/types/map";

const MARKER_DETAILS: Record<
  LocationType,
  {
    emoji: string;
    label: string;
    backgroundClass: string;
  }
> = {
  attraction: {
    emoji: "★",
    label: "Attraction",
    backgroundClass: "background:#0891b2",
  },
  restaurant: {
    emoji: "🍽",
    label: "Restaurant",
    backgroundClass: "background:#dc2626",
  },
  cafe: {
    emoji: "☕",
    label: "Café",
    backgroundClass: "background:#92400e",
  },
  hotel: {
    emoji: "🏨",
    label: "Hotel",
    backgroundClass: "background:#7c3aed",
  },
  station: {
    emoji: "🚆",
    label: "Station",
    backgroundClass: "background:#2563eb",
  },
  transport: {
    emoji: "🚠",
    label: "Transportation",
    backgroundClass: "background:#0369a1",
  },
  viewpoint: {
    emoji: "🏔",
    label: "Viewpoint",
    backgroundClass: "background:#059669",
  },
  shopping: {
    emoji: "🛍",
    label: "Shopping",
    backgroundClass: "background:#db2777",
  },
  parking: {
    emoji: "P",
    label: "Parking",
    backgroundClass: "background:#475569",
  },
  other: {
    emoji: "●",
    label: "Location",
    backgroundClass: "background:#525252",
  },
};

function createMarkerIcon(type: LocationType) {
  const marker = MARKER_DETAILS[type] ?? MARKER_DETAILS.other;

  return divIcon({
    className: "beast-map-marker",
    html: `
      <div
        style="
          ${marker.backgroundClass};
          width:40px;
          height:40px;
          border:3px solid rgba(255,255,255,0.95);
          border-radius:9999px;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 8px 24px rgba(0,0,0,0.45);
          color:white;
          font-size:17px;
          font-weight:800;
          line-height:1;
        "
        aria-hidden="true"
      >
        ${marker.emoji}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42],
  });
}

function normalizeLocation(
  location: InteractiveMapProps["locations"][number],
): MapMarker {
  return {
    id: location.id,
    name: location.name,
    type: location.type,
    coordinates: location.coordinates,
    description: location.description,
    address: location.address,
  };
}

export default function InteractiveMapClient({
  center,
  zoom,
  locations,
  className = "",
  height = "520px",
  showAttribution = true,
}: InteractiveMapProps) {
  const mapCenter: LatLngExpression = [
    center.latitude,
    center.longitude,
  ];

  return (
    <div
      className={`
        relative isolate overflow-hidden rounded-3xl
        border border-white/10 bg-neutral-900 shadow-2xl
        shadow-black/30 ${className}
      `}
      style={{ height }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution={
            showAttribution
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              : ""
          }
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        {locations.map(normalizeLocation).map((location) => {
          const markerDetails =
            MARKER_DETAILS[location.type] ?? MARKER_DETAILS.other;

          const position: LatLngExpression = [
            location.coordinates.latitude,
            location.coordinates.longitude,
          ];

          return (
            <Marker
              key={location.id}
              position={position}
              icon={createMarkerIcon(location.type)}
            >
              <Popup>
                <div className="min-w-52 text-neutral-900">
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                    {markerDetails.label}
                  </p>

                  <h3 className="mt-1 text-base font-bold">
                    {location.name}
                  </h3>

                  {location.description ? (
                    <p className="mt-2 text-sm leading-5 text-neutral-600">
                      {location.description}
                    </p>
                  ) : null}

                  {location.address ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      {location.address}
                    </p>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div
        className="
          pointer-events-none absolute left-4 top-4 z-[500]
          rounded-full border border-white/20 bg-black/65
          px-4 py-2 text-xs font-bold uppercase
          tracking-[0.16em] text-white shadow-lg backdrop-blur-md
        "
      >
        Interactive map
      </div>
    </div>
  );
}
EOF

cat > "$MAP_TEST_PAGE" <<'EOF'
import Link from "next/link";

import InteractiveMap from "@/components/trip/InteractiveMap";
import type { TripLocation } from "@/types/itinerary";

const testLocations: TripLocation[] = [
  {
    id: "chapel-bridge",
    name: "Chapel Bridge",
    type: "attraction",
    coordinates: {
      latitude: 47.05165,
      longitude: 8.30748
    },
    description: "Historic covered wooden bridge in central Lucerne.",
    address: "Kapellbrücke, 6002 Luzern",
    durationMinutes: 45,
    reservationStatus: "not-required"
  },
  {
    id: "lucerne-station",
    name: "Lucerne Railway Station",
    type: "station",
    coordinates: {
      latitude: 47.05015,
      longitude: 8.31018
    },
    description: "Primary arrival and departure point for the Lucerne day trip.",
    address: "Zentralstrasse 1, 6003 Luzern",
    reservationStatus: "not-required"
  },
  {
    id: "lion-monument",
    name: "Lion Monument",
    type: "attraction",
    coordinates: {
      latitude: 47.05833,
      longitude: 8.31056
    },
    description: "Monument commemorating Swiss Guards killed during the French Revolution.",
    address: "Denkmalstrasse 4, 6006 Luzern",
    durationMinutes: 30,
    reservationStatus: "not-required"
  },
  {
    id: "lake-lucerne",
    name: "Lake Lucerne Waterfront",
    type: "viewpoint",
    coordinates: {
      latitude: 47.05273,
      longitude: 8.31159
    },
    description: "Waterfront views near the railway station and historic center.",
    durationMinutes: 60,
    reservationStatus: "not-required"
  }
];

export default function MapTestPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="
            inline-flex rounded-full border border-white/15
            bg-white/5 px-5 py-3 text-sm font-semibold
            transition hover:border-cyan-300 hover:text-cyan-200
          "
        >
          ← Back to BEAST Travel
        </Link>

        <p className="mt-16 text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">
          BT-018B validation
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
          Interactive map component
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-400">
          This test page validates map rendering, OpenStreetMap tiles,
          custom location markers, zoom controls, and popups before the
          component is integrated into itinerary day pages.
        </p>

        <div className="mt-12">
          <InteractiveMap
            center={{
              latitude: 47.0502,
              longitude: 8.3093
            }}
            zoom={14}
            locations={testLocations}
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {testLocations.map((location) => (
            <article
              key={location.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                {location.type}
              </p>
              <h2 className="mt-2 font-bold">{location.name}</h2>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
EOF

echo
echo "Checking TypeScript..."

docker compose exec -T "$SERVICE" \
  npx tsc --noEmit

echo
echo "Waiting for Next.js to reload..."
sleep 5

HTTP_CODE="$(
  curl -sS -o /dev/null -w '%{http_code}' \
    http://127.0.0.1:3005/map-test \
    || true
)"

echo "Map test page: HTTP ${HTTP_CODE}"

if [[ "$HTTP_CODE" != "200" ]]; then
  echo
  echo "ERROR: Expected HTTP 200 from /map-test."
  echo
  docker compose logs --tail=120 "$SERVICE"
  exit 1
fi

echo
echo "Checking recent application logs..."

if docker compose logs --since=3m "$SERVICE" 2>&1 |
  grep -E 'Module not found|TypeError|ReferenceError|SyntaxError|window is not defined|⨯'
then
  echo
  echo "ERROR: Recent application errors detected."
  exit 1
else
  echo "No recent application errors."
fi

echo
echo "Installed files:"
printf '  %s\n' \
  "$MAP_TYPES_FILE" \
  "$MAP_WRAPPER_FILE" \
  "$MAP_CLIENT_FILE" \
  "$MAP_TEST_PAGE"

echo
echo "BT-018B installed successfully."
echo "Backup: $BACKUP_DIR"
echo
echo "Open:"
echo "  http://192.168.86.61:3005/map-test"
