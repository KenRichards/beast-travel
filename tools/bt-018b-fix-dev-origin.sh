#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

SERVICE="beast-travel"
BACKUP_DIR=".backups/bt-018b-origin-$(date +%Y%m%d-%H%M%S)"

echo "=========================================="
echo " BT-018B — Allow LAN Development Origin"
echo "=========================================="

mkdir -p "$BACKUP_DIR"

for file in \
  next.config.ts \
  next.config.js \
  next.config.mjs \
  next.config.cjs
do
  if [[ -f "$file" ]]; then
    cp "$file" "$BACKUP_DIR/$file"
  fi
done

cat > next.config.ts <<'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.86.61",
    "localhost",
    "127.0.0.1",
    "beastnas",
    "beastnas-r640",
    "*.beast-home.com",
  ],
};

export default nextConfig;
EOF

rm -f next.config.js next.config.mjs next.config.cjs

echo
echo "Updated next.config.ts:"
cat next.config.ts

echo
echo "Stopping development runtime..."
docker compose down

echo
echo "Removing generated Next.js state..."
rm -rf .next

echo
echo "Recreating development runtime..."
docker compose up -d --force-recreate

echo
echo "Waiting for the application..."

READY=0

for attempt in $(seq 1 40); do
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

echo
echo "Checking LAN asset response..."

FONT_PATH="$(
  curl -sS http://127.0.0.1:3005/map-test |
    grep -oE '/_nextjs_font/[^"]+\.woff2' |
    head -n 1 || true
)"

if [[ -n "$FONT_PATH" ]]; then
  FONT_STATUS="$(
    curl -sS \
      -H 'Host: 192.168.86.61:3005' \
      -H 'Origin: http://192.168.86.61:3005' \
      -o /dev/null \
      -w '%{http_code}' \
      "http://127.0.0.1:3005${FONT_PATH}" ||
      true
  )"

  echo "Next.js font asset: HTTP ${FONT_STATUS}"

  if [[ "$FONT_STATUS" == "403" ]]; then
    echo "ERROR: LAN development assets are still being rejected."
    exit 1
  fi
else
  echo "No generated font asset was found in the page HTML."
fi

echo
echo "Checking recent server errors..."

if docker compose logs --since=3m "$SERVICE" 2>&1 |
  grep -E 'Module not found|TypeError|ReferenceError|SyntaxError|⨯'
then
  echo
  echo "ERROR: Application errors detected."
  exit 1
else
  echo "No recent server-side application errors."
fi

echo
echo "BT-018B LAN origin repair complete."
echo "Backup: $BACKUP_DIR"
echo
echo "Open a new browser tab:"
echo "  http://192.168.86.61:3005/map-test"
