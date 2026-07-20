#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================="
echo " BT-016 — Premium Destination Cards"
echo " Steps 3 and 4"
echo "========================================="

test -f package.json || {
  echo "ERROR: package.json was not found."
  echo "Run this script from the BEAST Travel repository."
  exit 1
}

mkdir -p \
  .backups/bt-016 \
  src/components \
  public/images/destinations

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [[ -f src/components/DestinationCard.tsx ]]; then
  cp \
    src/components/DestinationCard.tsx \
    ".backups/bt-016/DestinationCard.tsx.${TIMESTAMP}"

  echo "Backed up DestinationCard.tsx"
fi

cat > src/components/DestinationCard.tsx <<'EOF'
import Image from "next/image";

import type { ItineraryDay } from "@/types/itinerary";

interface DestinationCardProps {
  day: ItineraryDay;
}

export default function DestinationCard({
  day,
}: DestinationCardProps) {
  return (
    <article
      className="
        group
        overflow-hidden
        rounded-3xl
        border border-white/10
        bg-white/5
        shadow-2xl shadow-black/20
        backdrop-blur
        transition-all duration-300
        hover:-translate-y-1
        hover:border-cyan-400/60
        hover:bg-white/10
        hover:shadow-cyan-500/10
      "
    >
      <div className="relative h-72 overflow-hidden sm:h-80 lg:h-96">
        <Image
          src={day.image}
          alt={`${day.title}, ${day.location}`}
          fill
          sizes="
            (max-width: 640px) 100vw,
            (max-width: 1024px) 90vw,
            1152px
          "
          className="
            object-cover
            transition-transform
            duration-700
            ease-out
            group-hover:scale-110
          "
        />

        <div
          className="
            absolute inset-0
            bg-gradient-to-t
            from-black
            via-black/35
            to-black/5
          "
        />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  uppercase
                  tracking-[0.22em]
                  text-cyan-300
                "
              >
                Day {day.day}
              </p>

              <h3
                className="
                  mt-2
                  text-3xl
                  font-black
                  tracking-tight
                  text-white
                  sm:text-4xl
                  lg:text-5xl
                "
              >
                {day.title}
              </h3>

              <p className="mt-2 text-base text-gray-200 sm:text-lg">
                {day.location}
              </p>
            </div>

            <span
              aria-hidden="true"
              className="
                hidden
                rounded-2xl
                border border-white/20
                bg-black/30
                p-4
                text-4xl
                backdrop-blur-md
                sm:block
              "
            >
              {day.icon}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <p className="max-w-3xl text-base leading-7 text-gray-300 sm:text-lg">
          {day.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span
            className="
              rounded-full
              border border-cyan-400/20
              bg-cyan-500/15
              px-4 py-2
              text-cyan-200
            "
          >
            {day.transport}
          </span>

          <span
            className="
              rounded-full
              border border-white/10
              bg-white/5
              px-4 py-2
              text-gray-200
            "
          >
            {day.travelTime}
          </span>

          <span
            className="
              rounded-full
              border border-emerald-400/20
              bg-emerald-500/15
              px-4 py-2
              text-emerald-200
            "
          >
            ${day.budget}
          </span>
        </div>

        <button
          type="button"
          className="
            mt-8
            inline-flex
            items-center
            rounded-full
            border border-cyan-400
            px-6 py-3
            font-semibold
            text-cyan-200
            transition-all
            hover:bg-cyan-400
            hover:text-black
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-offset-4
            focus-visible:outline-cyan-400
          "
        >
          Explore Day
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </button>
      </div>
    </article>
  );
}
EOF

SOURCE_IMAGE=""

if [[ -f public/images/switzerland-hero.jpg ]]; then
  SOURCE_IMAGE="public/images/switzerland-hero.jpg"
elif [[ -f switzerland-hero.jpg ]]; then
  SOURCE_IMAGE="switzerland-hero.jpg"
else
  echo "ERROR: Could not find an existing Switzerland hero JPG."
  echo "Expected one of:"
  echo "  public/images/switzerland-hero.jpg"
  echo "  switzerland-hero.jpg"
  exit 1
fi

for destination in zurich lucerne grindelwald jungfraujoch; do
  destination_file="public/images/destinations/${destination}.jpg"

  if [[ ! -f "$destination_file" ]]; then
    cp "$SOURCE_IMAGE" "$destination_file"
    echo "Created temporary image: $destination_file"
  else
    echo "Keeping existing image: $destination_file"
  fi
done

echo
echo "Files created or updated:"
echo "  src/components/DestinationCard.tsx"
echo "  public/images/destinations/zurich.jpg"
echo "  public/images/destinations/lucerne.jpg"
echo "  public/images/destinations/grindelwald.jpg"
echo "  public/images/destinations/jungfraujoch.jpg"

echo
echo "BT-016 steps 3 and 4 complete."
echo
echo "Temporary destination images all use the existing hero image."
echo "They can be replaced individually later without changing any code."
