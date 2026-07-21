import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import TimelineEventCard from "@/components/trip/TimelineEventCard";
import TripNavigation from "@/components/trip/TripNavigation";
import { loadApprovedReservations } from "@/lib/import/persistence/reservations";
import { getItinerary } from "@/lib/itinerary";
import {
  calculateTodayDashboard,
  normalizeLodgings,
  normalizeTimeline,
} from "@/lib/timeline";
import { formatClockTime, formatTripDate, TRIP_TIME_ZONE } from "@/lib/trip-time";
import type { TimelineEvent } from "@/types/timeline";

export const metadata: Metadata = {
  title: "Today | BEAST Travel",
  description: "The next actions and essential details for the trip day.",
};

function compactTime(event: TimelineEvent) {
  return event.time ? formatClockTime(event.time) : event.timeLabel;
}

export default async function TodayPage() {
  await connection();
  const itinerary = getItinerary();
  const loaded = await loadApprovedReservations();
  const events = normalizeTimeline(itinerary, loaded.reservations);
  const lodgings = normalizeLodgings(itinerary, loaded.reservations);
  const dashboard = calculateTodayDashboard(
    itinerary,
    events,
    lodgings,
    new Date(),
  );
  const remainingToday = dashboard.upcomingEvents.filter(
    (event) => event.id !== dashboard.nextEvent?.id,
  );

  if (dashboard.phase === "after-trip") {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <PageHeader />
        <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="rounded-[2rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_top_right,_rgba(52,211,153,0.15),_transparent_45%)] p-8 sm:p-14">
            <span className="text-5xl" aria-hidden="true">✓</span>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.26em] text-emerald-300">
              Trip complete
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-6xl">
              Welcome home.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-300">
              The Switzerland trip ended {formatTripDate(itinerary.trip.endDate ?? dashboard.date)}.
              The full itinerary and imported reservation history remain available.
            </p>
            <Link
              href="/timeline"
              className="mt-8 inline-flex rounded-full bg-emerald-300 px-6 py-3 font-bold text-neutral-950"
            >
              Review the trip timeline
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <PageHeader />
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.13),_transparent_38%)]">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">
            {dashboard.phase === "before-trip" ? "Next trip day" : "Today in Switzerland"}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            {formatTripDate(dashboard.date)}
          </h1>
          <p className="mt-4 text-lg text-neutral-300">
            {dashboard.tripDayNumber
              ? `Day ${dashboard.tripDayNumber} · ${dashboard.tripDayTitle}`
              : dashboard.phase === "before-trip"
                ? "Your first trip day is coming up."
                : "A flexible Switzerland trip day."}
          </p>
          {dashboard.phase === "before-trip" ? (
            <p className="mt-5 max-w-2xl rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-4 text-sm leading-6 text-cyan-50/80">
              The trip has not started in {TRIP_TIME_ZONE}. This dashboard is
              previewing the next upcoming trip day.
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-10">
          <section aria-labelledby="next-heading">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Up next
            </p>
            <h2 id="next-heading" className="mt-3 text-3xl font-black">
              Next scheduled item
            </h2>
            {dashboard.nextEvent ? (
              <div className="mt-5">
                {dashboard.nextEvent.date !== dashboard.date ? (
                  <p className="mb-3 text-sm font-bold text-neutral-400">
                    {formatTripDate(dashboard.nextEvent.date, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                ) : null}
                <TimelineEventCard event={dashboard.nextEvent} featured />
              </div>
            ) : (
              <EmptyState message="Nothing else is scheduled. Enjoy some unstructured time." />
            )}
          </section>

          <section aria-labelledby="upcoming-heading">
            <div className="flex items-end justify-between gap-4">
              <h2 id="upcoming-heading" className="text-2xl font-black">
                Upcoming today
              </h2>
              <span className="text-sm text-neutral-500">
                {remainingToday.length} item{remainingToday.length === 1 ? "" : "s"}
              </span>
            </div>
            {remainingToday.length ? (
              <div className="mt-5 space-y-4">
                {remainingToday.map((event) => (
                  <TimelineEventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState message="No additional items are scheduled for this day." />
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-violet-300/20 bg-violet-300/[0.07] p-6" aria-labelledby="lodging-heading">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
              Current lodging
            </p>
            <h2 id="lodging-heading" className="mt-3 text-xl font-black">
              {dashboard.currentLodging?.name ?? "No lodging assigned"}
            </h2>
            {dashboard.currentLodging ? (
              <>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  {dashboard.currentLodging.address ?? dashboard.currentLodging.city}
                </p>
                {dashboard.currentLodging.confirmationReference ? (
                  <div className="mt-5 rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-neutral-500">Confirmation</p>
                    <p className="mt-1 font-mono font-bold">
                      {dashboard.currentLodging.confirmationReference}
                    </p>
                  </div>
                ) : null}
                {dashboard.currentLodging.reservationHref ? (
                  <Link
                    href={dashboard.currentLodging.reservationHref}
                    className="mt-5 inline-flex text-sm font-bold text-violet-100 underline decoration-violet-200/30 underline-offset-4"
                  >
                    Open lodging reservation →
                  </Link>
                ) : (
                  <Link
                    href={`/trips/${itinerary.trip.id}/logistics`}
                    className="mt-5 inline-flex text-sm font-bold text-violet-100 underline decoration-violet-200/30 underline-offset-4"
                  >
                    Open trip logistics →
                  </Link>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Check the timeline or trip logistics for the next confirmed stay.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-6" aria-labelledby="transport-heading">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Getting around
            </p>
            <h2 id="transport-heading" className="mt-3 text-xl font-black">
              Transportation details
            </h2>
            {dashboard.transportationEvents.length ? (
              <ul className="mt-5 divide-y divide-white/10">
                {dashboard.transportationEvents.map((event) => (
                  <li key={event.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{event.title}</p>
                        <p className="mt-1 text-sm text-neutral-400">
                          {event.location ?? event.transport ?? "Trip transportation"}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold text-cyan-100">
                        {compactTime(event)}
                      </span>
                    </div>
                    {event.confirmationReference ? (
                      <p className="mt-2 text-xs text-neutral-400">
                        Confirmation <span className="font-mono text-white">{event.confirmationReference}</span>
                      </p>
                    ) : null}
                    <Link href={event.sourceLink.href} className="mt-2 inline-flex text-xs font-bold text-cyan-100">
                      Details →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-neutral-400">
                No transportation item is assigned to this day.
              </p>
            )}
          </section>

          {loaded.malformedFiles.length ? (
            <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm text-amber-100" role="status">
              Some imported records could not be read; valid trip data is shown.
            </p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function PageHeader() {
  return (
    <header className="border-b border-white/10 bg-neutral-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" className="text-sm font-black tracking-[0.3em] text-cyan-300">
          BEAST TRAVEL
        </Link>
        <TripNavigation compact />
      </div>
    </header>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-7 text-center text-sm leading-6 text-neutral-400">
      {message}
    </div>
  );
}
