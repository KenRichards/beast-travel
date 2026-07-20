#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

SERVICE="beast-travel"
MAP_FILE="src/components/trip/InteractiveMap.tsx"
OLD_CLIENT_FILE="src/components/trip/InteractiveMapClient.tsx"
BACKUP_DIR=".backups/bt-018b-fix-$(date +%Y%m%d-%H%M%S)"

echo "=========================================="
echo " BT-018B — Fix Persistent Map Loading"
echo "=========================================="

for required in \
  package.json \
  compose.yaml \
  src/types/map.ts \
  src/types/itinerary.ts
do
  if [[ ! -f "$required" ]]; then
    echo "ERROR: Missing required file: $required"
    exit 1
  fi
done

mkdir -p "$BACKUP_DIR/src/components/trip"

for file in "$MAP_FILE" "$OLD_CLIENT_FILE"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$BACKUP_DIR/$file"
  fi
done

cat > "$MAP_FILE" <<'EOF'
"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { LocationType } from "@/types/itinerary";
import type {
  InteractiveMapProps,
  MapMarker,
} from "@/types/map";

const MARKER_DETAILS: Record<
  LocationType,
  {
    symbol: string;
    label: string;
    background: string;
  }
> = {
  attraction: {
    symbol: "★",
    label: "Attraction",
    background: "#0891b2",
  },
  restaurant: {
    symbol: "🍽",
    label: "Restaurant",
    background: "#dc2626",
  },
  cafe: {
    symbol: "☕",
    label: "Café",
    background: "#92400e",
  },
  hotel: {
    symbol: "🏨",
    label: "Hotel",
    background: "#7c3aed",
  },
  station: {
    symbol: "🚆",
    label: "Station",
    background: "#2563eb",
  },
  transport: {
    symbol: "🚠",
    label: "Transportation",
    background: "#0369a1",
  },
  viewpoint: {
    symbol: "🏔",
    label: "Viewpoint",
    background: "#059669",
  },
  shopping: {
    symbol: "🛍",
    label: "Shopping",
    background: "#db2777",
  },
  parking: {
    symbol: "P",
    label: "Parking",
    background: "#475569",
  },
  other: {
    symbol: "●",
    label: "Location",
    background: "#525252",
  },
};

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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function InteractiveMap({
  center,
  zoom,
  locations,
  className = "",
  height = "520px",
  showAttribution = true,
}: InteractiveMapProps) {
  const reactId = useId();
  const mapElementId = `beast-map-${reactId.replaceAll(":", "")}`;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      try {
        setStatus("loading");

        const L = await import("leaflet");

        if (cancelled || !mapRef.current) {
          return;
        }

        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        const map = L.map(mapRef.current, {
          center: [center.latitude, center.longitude],
          zoom,
          zoomControl: false,
          scrollWheelZoom: false,
        });

        leafletMapRef.current = map;

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution: showAttribution
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              : "",
          },
        ).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        for (const rawLocation of locations) {
          const location = normalizeLocation(rawLocation);
          const details =
            MARKER_DETAILS[location.type] ?? MARKER_DETAILS.other;

          const icon = L.divIcon({
            className: "beast-map-marker",
            html: `
              <div
                style="
                  background:${details.background};
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
                ${details.symbol}
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -42],
          });

          const description = location.description
            ? `
              <p style="
                margin:8px 0 0;
                color:#525252;
                font-size:13px;
                line-height:1.45;
              ">
                ${escapeHtml(location.description)}
              </p>
            `
            : "";

          const address = location.address
            ? `
              <p style="
                margin:8px 0 0;
                color:#737373;
                font-size:11px;
                line-height:1.4;
              ">
                ${escapeHtml(location.address)}
              </p>
            `
            : "";

          const popup = `
            <div style="min-width:210px;color:#171717">
              <p style="
                margin:0;
                color:#0e7490;
                font-size:11px;
                font-weight:800;
                letter-spacing:0.08em;
                text-transform:uppercase;
              ">
                ${escapeHtml(details.label)}
              </p>

              <h3 style="
                margin:5px 0 0;
                color:#171717;
                font-size:16px;
                font-weight:800;
              ">
                ${escapeHtml(location.name)}
              </h3>

              ${description}
              ${address}
            </div>
          `;

          L.marker(
            [
              location.coordinates.latitude,
              location.coordinates.longitude,
            ],
            { icon },
          )
            .addTo(map)
            .bindPopup(popup);
        }

        window.setTimeout(() => {
          if (!cancelled) {
            map.invalidateSize();
          }
        }, 100);

        setStatus("ready");
      } catch (error) {
        console.error("Unable to initialize Leaflet map:", error);

        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [
    center.latitude,
    center.longitude,
    locations,
    showAttribution,
    zoom,
  ]);

  return (
    <div
      className={`
        relative isolate overflow-hidden rounded-3xl
        border border-white/10 bg-neutral-900 shadow-2xl
        shadow-black/30 ${className}
      `}
      style={{ height }}
    >
      <div
        id={mapElementId}
        ref={mapRef}
        className="h-full w-full"
        aria-label="Interactive travel map"
      />

      {status === "loading" ? (
        <div
          role="status"
          className="
            absolute inset-0 z-[600] flex items-center justify-center
            bg-neutral-900 text-sm font-semibold text-gray-400
          "
        >
          Loading map…
        </div>
      ) : null}

      {status === "error" ? (
        <div
          role="alert"
          className="
            absolute inset-0 z-[600] flex flex-col items-center
            justify-center bg-neutral-900 px-8 text-center
          "
        >
          <p className="font-bold text-red-300">
            The interactive map could not be loaded.
          </p>

          <p className="mt-2 max-w-md text-sm text-gray-400">
            Check the browser console and confirm this device can reach
            OpenStreetMap tile servers.
          </p>
        </div>
      ) : null}

      {status === "ready" ? (
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
      ) : null}
    </div>
  );
}
EOF

rm -f "$OLD_CLIENT_FILE"

echo
echo "Checking TypeScript..."
docker compose exec -T "$SERVICE" npx tsc --noEmit

echo
echo "Checking production build..."
docker compose exec -T "$SERVICE" npm run build

echo
echo "Restarting development runtime..."
docker compose down
rm -rf .next
docker compose up -d --force-recreate

echo
echo "Waiting for application..."

READY=0

for attempt in $(seq 1 30); do
  HTTP_CODE="$(
    curl -sS -o /dev/null -w '%{http_code}' \
      http://127.0.0.1:3005/map-test \
      2>/dev/null || true
  )"

  if [[ "$HTTP_CODE" == "200" ]]; then
    READY=1
    echo "Map test page: HTTP 200"
    break
  fi

  printf '.'
  sleep 2
done

echo

if [[ "$READY" -ne 1 ]]; then
  echo "ERROR: Application did not become ready."
  docker compose logs --tail=150 "$SERVICE"
  exit 1
fi

if docker compose logs --since=3m "$SERVICE" 2>&1 |
  grep -E 'Module not found|TypeError|ReferenceError|SyntaxError|window is not defined|⨯'
then
  echo
  echo "ERROR: Server-side application errors detected."
  exit 1
fi

echo
echo "No server-side application errors."
echo
echo "BT-018B map-loading repair complete."
echo "Backup: $BACKUP_DIR"
echo
echo "Open in a new browser tab:"
echo "  http://192.168.86.61:3005/map-test"
