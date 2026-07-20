#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

SERVICE="beast-travel"

echo "=========================================="
echo " BT-018B — Reset Development Runtime"
echo "=========================================="

echo
echo "Stopping the development container..."
docker compose down

echo
echo "Removing generated Next.js state..."
rm -rf .next

echo
echo "Recreating the development container..."
docker compose up -d --force-recreate

echo
echo "Waiting for Next.js..."
READY=0

for attempt in $(seq 1 30); do
  CODE="$(
    curl -sS -o /dev/null -w '%{http_code}' \
      http://127.0.0.1:3005/map-test \
      2>/dev/null || true
  )"

  if [[ "$CODE" == "200" ]]; then
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
echo "Verifying installed packages..."
docker compose exec -T "$SERVICE" \
  npm ls leaflet react-leaflet @types/leaflet

echo
echo "Checking recent errors..."

if docker compose logs --since=3m "$SERVICE" 2>&1 |
  grep -E 'Module not found|TypeError|ReferenceError|SyntaxError|window is not defined|⨯'
then
  echo
  echo "ERROR: Application errors detected."
  exit 1
else
  echo "No recent application errors."
fi

echo
echo "Development runtime reset complete."
echo "Open: http://192.168.86.61:3005/map-test"
