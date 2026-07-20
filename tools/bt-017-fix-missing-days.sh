#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

ITINERARY="src/data/trips/switzerland-2026/itinerary.json"
BACKUP_DIR=".backups/bt-017-fix-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [[ -f "$ITINERARY" ]]; then
  cp "$ITINERARY" "$BACKUP_DIR/itinerary.json"
fi

cat > "$ITINERARY" <<'EOF'
{
  "trip": {
    "id": "switzerland-2026",
    "title": "Switzerland Family Adventure",
    "subtitle": "July 22–29, 2026",
    "heroImage": "/images/switzerland-hero.jpg"
  },
  "days": [
    {
      "day": 1,
      "title": "Arrive in Zürich",
      "icon": "✈️",
      "location": "Zürich",
      "image": "/images/destinations/zurich.jpg",
      "transport": "Flight",
      "travelTime": "Arrival day",
      "budget": 250,
      "description": "Arrive in Switzerland, check into the hotel, explore Zürich's Altstadt, and enjoy dinner along the Limmat."
    },
    {
      "day": 2,
      "title": "Lucerne",
      "icon": "🚞",
      "location": "Lucerne",
      "image": "/images/destinations/lucerne.jpg",
      "transport": "Train",
      "travelTime": "About 50 minutes",
      "budget": 180,
      "description": "Visit Chapel Bridge, explore the historic old town, see the Lion Monument, and enjoy the Lake Lucerne waterfront."
    },
    {
      "day": 3,
      "title": "Grindelwald",
      "icon": "🏔️",
      "location": "Grindelwald",
      "image": "/images/destinations/grindelwald.jpg",
      "transport": "Train",
      "travelTime": "About 2 hours 45 minutes",
      "budget": 260,
      "description": "Travel into the Bernese Oberland, settle into Grindelwald, and explore the alpine village beneath the Eiger."
    },
    {
      "day": 4,
      "title": "Jungfraujoch",
      "icon": "🚠",
      "location": "Jungfraujoch",
      "image": "/images/destinations/jungfraujoch.jpg",
      "transport": "Train and gondola",
      "travelTime": "Full-day excursion",
      "budget": 420,
      "description": "Journey to the Top of Europe, visit the Sphinx Observatory and Ice Palace, and experience the high-Alpine scenery."
    }
  ]
}
EOF

echo "Updated: $ITINERARY"
echo "Backup:  $BACKUP_DIR/itinerary.json"

if command -v python3 >/dev/null 2>&1; then
  python3 -m json.tool "$ITINERARY" >/dev/null
  echo "JSON validation passed."
fi

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

if [[ "$FAILED" -ne 0 ]]; then
  echo "One or more routes failed."
  echo "Run:"
  echo "  docker compose logs --tail=100 beast-travel"
  exit 1
fi

echo "BT-017 route repair complete."
