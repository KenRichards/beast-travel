#!/usr/bin/env bash
set -euo pipefail

echo "==> Creating project structure..."

mkdir -p \
src/components/{hero,layout,navigation,trip,ui} \
src/lib \
src/data/trips/switzerland-2026 \
src/styles \
src/types \
public/branding \
public/images \
public/photos

echo "==> Installing UI packages..."

npm install \
framer-motion \
lucide-react \
clsx \
tailwind-merge

echo "==> Installing development packages..."

npm install -D \
prettier \
prettier-plugin-tailwindcss \
husky \
lint-staged

echo "==> Creating data files..."

cat > src/data/trips/switzerland-2026/trip.json <<'EOF'
{
  "title": "Switzerland 2026",
  "subtitle": "The Richards Family Adventure",
  "dates": "July 22–29, 2026",
  "version": "0.1.0"
}
EOF

echo ""
echo "Bootstrap complete."
