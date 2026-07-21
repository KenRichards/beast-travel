import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import TimelineEventCard from "@/components/trip/TimelineEventCard";
import TripNavigation from "@/components/trip/TripNavigation";
import { loadApprovedReservations } from "@/lib/import/persistence/reservations";
import { getItinerary } from "@/lib/itinerary";
import { groupTimelineByDay, normalizeTimeline } from "@/lib/timeline";
import { formatTripDate, TRIP_TIME_ZONE } from "@/lib/trip-time";

export const metadata: Metadata = {
  title: "Trip Timeline | BEAST Travel",
  description: "A unified chronological view of the Switzerland trip.",
};

export default async function TimelinePage() {
  await connection();
  const itinerary = getItinerary();
  const loaded = await loadApprovedReservations();
  const days = groupTimelineByDay(
    normalizeTimeline(itinerary, loaded.reservations),
  );

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_38%),radial-gradient(circle_at_top_left,_rgba(139,92,246,0.13),_transparent_32%)]">
        <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-sm font-black tracking-[0.3em] text-cyan-300">
              BEAST TRAVEL
            </Link>
            <TripNavigation compact />
          </div>
          <p className="mt-14 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Switzerland · {TRIP_TIME_ZONE}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            Unified trip timeline
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg">
            Flights, stays, rental cars, transportation, and itinerary plans in
            one local-time sequence.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
        {loaded.malformedFiles.length ? (
          <div className="mb-8 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] p-4 text-sm text-amber-100" role="status">
            {loaded.malformedFiles.length} malformed imported record
            {loaded.malformedFiles.length === 1 ? " was" : "s were"} skipped.
            The rest of the timeline is available.
          </div>
        ) : null}

        {days.length ? (
          <div className="space-y-14">
            {days.map((day) => (
              <section key={day.date} aria-labelledby={`day-${day.date}`}>
                <div className="sticky top-0 z-10 -mx-2 border-b border-white/10 bg-neutral-950/95 px-2 py-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                    {day.date}
                  </p>
                  <h2 id={`day-${day.date}`} className="mt-1 text-2xl font-black sm:text-3xl">
                    {formatTripDate(day.date, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h2>
                </div>
                <div className="mt-5 space-y-4 border-l border-white/10 pl-3 sm:pl-6">
                  {day.events.map((event) => (
                    <TimelineEventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.025] p-10 text-center">
            <h2 className="text-2xl font-bold">No timeline events yet</h2>
            <p className="mt-3 text-neutral-400">
              Add dated itinerary activities or approve an imported reservation
              to build the trip sequence.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
