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
