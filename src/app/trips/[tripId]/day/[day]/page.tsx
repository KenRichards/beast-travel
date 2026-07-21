import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import InteractiveMap from "@/components/trip/InteractiveMap";
import TripLogisticsPanel from "@/components/trip/TripLogistics";
import { getItinerary, getItineraryDay } from "@/lib/itinerary";
import { mergeImportedLogistics } from "@/lib/import/logistics";
import { loadApprovedReservations } from "@/lib/import/persistence/reservations";

interface DayPageProps {
  params: Promise<{
    tripId: string;
    day: string;
  }>;
}

export function generateStaticParams() {
  const itinerary = getItinerary();

  return itinerary.days.map((day) => ({
    tripId: itinerary.trip.id,
    day: String(day.day),
  }));
}

export async function generateMetadata({
  params,
}: DayPageProps): Promise<Metadata> {
  const { tripId, day } = await params;
  const itineraryDay = getItineraryDay(tripId, Number(day));

  if (!itineraryDay) {
    return {
      title: "Day Not Found | BEAST Travel",
    };
  }

  return {
    title: `${itineraryDay.title} | BEAST Travel`,
    description: itineraryDay.description,
  };
}

function formatBudget(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DayPage({ params }: DayPageProps) {
  await connection();
  const { tripId, day } = await params;
  const dayNumber = Number(day);
  const itinerary = getItinerary();
  const itineraryDay = getItineraryDay(tripId, dayNumber);
  const approvedReservations = await loadApprovedReservations();
  const logistics = mergeImportedLogistics(
    itinerary.logistics,
    approvedReservations.reservations,
  );

  if (!Number.isInteger(dayNumber) || !itineraryDay) {
    notFound();
  }

  const previousDay = itinerary.days.find(
    (entry) => entry.day === dayNumber - 1,
  );

  const nextDay = itinerary.days.find(
    (entry) => entry.day === dayNumber + 1,
  );

  const currency =
    itineraryDay.dailyBudget.currency ||
    itinerary.trip.currency ||
    "CHF";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative min-h-[72vh] overflow-hidden">
        <Image
          src={itineraryDay.image}
          alt={`${itineraryDay.title}, ${itineraryDay.location}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/45 to-black/15" />

        <div className="relative mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-end px-6 pb-16 pt-28 sm:px-10 lg:px-12">
          <Link
            href="/#journey"
            className="
              mb-auto w-fit rounded-full border border-white/20
              bg-black/25 px-5 py-3 text-sm font-semibold
              text-white backdrop-blur-md transition
              hover:border-cyan-300 hover:text-cyan-200
            "
          >
            ← Back to Journey
          </Link>

          <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
            Day {itineraryDay.day}
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-8xl">
            {itineraryDay.title}
          </h1>

          <p className="mt-4 text-xl text-gray-200 sm:text-2xl">
            {itineraryDay.location}
          </p>

          {itineraryDay.date ? (
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
              {new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: itinerary.trip.timezone,
              }).format(new Date(`${itineraryDay.date}T12:00:00`))}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_0.75fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-300">
              Overview
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Today&apos;s adventure
            </h2>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-gray-300">
              {itineraryDay.description}
            </p>

            <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8">
              <h3 className="text-2xl font-bold">Today&apos;s plan</h3>

              {itineraryDay.schedule.length > 0 ? (
                <ol className="mt-8 space-y-6">
                  {itineraryDay.schedule.map((item) => (
                    <li key={item.id} className="flex gap-5">
                      <div className="w-20 shrink-0">
                        <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-bold text-cyan-200">
                          {item.time}
                        </span>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
                          {item.sourceStatus}
                        </p>
                        <p className="font-semibold text-white">
                          {item.title}
                        </p>

                        <p className="mt-1 leading-6 text-gray-400">
                          {item.description}
                        </p>

                        {item.transport ? (
                          <p className="mt-2 text-sm text-cyan-300">
                            {item.transport}
                          </p>
                        ) : null}

                        {item.ticketRequired || item.reservationRequired ? (
                          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-200">
                            {[
                              item.ticketRequired ? "Ticket required" : null,
                              item.reservationRequired ? "Reservation required" : null,
                            ].filter(Boolean).join(" · ")}
                          </p>
                        ) : null}

                        {item.operationalNotes?.length ? (
                          <ul className="mt-3 space-y-1 text-sm leading-6 text-gray-400">
                            {item.operationalNotes.map((note) => <li key={note}>• {note}</li>)}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="mt-8 space-y-6">
                  <div className="flex gap-5">
                    <span className="text-3xl" aria-hidden="true">
                      ☀️
                    </span>
                    <div>
                      <p className="font-semibold text-white">Morning</p>
                      <p className="mt-1 text-gray-400">
                        Begin the day at a relaxed pace and travel to the
                        primary destination.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <span className="text-3xl" aria-hidden="true">
                      🏔️
                    </span>
                    <div>
                      <p className="font-semibold text-white">Afternoon</p>
                      <p className="mt-1 text-gray-400">
                        Explore the scenery, landmarks, and local
                        experiences.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <span className="text-3xl" aria-hidden="true">
                      🍽️
                    </span>
                    <div>
                      <p className="font-semibold text-white">Evening</p>
                      <p className="mt-1 text-gray-400">
                        Enjoy dinner and a flexible evening near the hotel
                        or town center.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                Day details
              </p>

              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="text-sm text-gray-500">Transportation</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {itineraryDay.transport}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-gray-500">Travel time</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {itineraryDay.travelTime}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-gray-500">
                    Estimated budget
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-emerald-300">
                    {formatBudget(itineraryDay.dailyBudget.total, currency)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-gray-500">
                    Planned locations
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {itineraryDay.locations.length}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                Map status
              </p>

              <p className="mt-4 leading-7 text-cyan-50/80">
                {itineraryDay.locations.length > 0
                  ? `${itineraryDay.locations.length} planned location${
                      itineraryDay.locations.length === 1 ? "" : "s"
                    } are displayed on today’s map.`
                  : "The map is centered on today’s destination. Detailed stops and recommendations will be added in BT-018D."}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-300">
                Explore
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Today&apos;s map
              </h2>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-400">
                Explore the destination, planned attractions,
                transportation points, restaurants, and viewpoints.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-300">
              {itineraryDay.location}
            </div>
          </div>

          <div className="mt-10">
            <InteractiveMap
              center={itineraryDay.map.center}
              zoom={itineraryDay.map.zoom}
              locations={itineraryDay.locations}
              height="min(68vh, 680px)"
            />
          </div>

          {itineraryDay.locations.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {itineraryDay.locations.map((location) => (
                <article
                  key={location.id}
                  className="
                    rounded-2xl border border-white/10 bg-white/5 p-6
                    transition hover:border-cyan-300/40 hover:bg-white/10
                  "
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                    {location.type} · {location.sourceStatus}
                  </p>

                  <h3 className="mt-2 text-lg font-bold">
                    {location.name}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-400">
                    {location.description}
                  </p>

                  {location.durationMinutes ? (
                    <p className="mt-4 text-xs font-semibold text-gray-500">
                      Suggested time: {location.durationMinutes} minutes
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
              <p className="font-semibold text-gray-300">
                Destination map enabled
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Attractions, stations, restaurants, and viewpoints will
                appear here when real trip locations are populated.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-white/10 bg-amber-300/[0.035]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-12">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-200">Operational plan</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight">Start, finish, and fallback</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["Start", itineraryDay.operations.startLocation],
              ["End", itineraryDay.operations.endLocation],
              ["Departure window", itineraryDay.operations.departureWindow],
              ["Weather sensitivity", itineraryDay.operations.weatherSensitivity],
              ["Physical effort", itineraryDay.operations.physicalEffort],
              ["Fallback plan", itineraryDay.operations.fallbackPlan],
            ].map(([label, value]) => (
              <article key={label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-200">{label}</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">{value}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-4">
            {[
              ["Parking", itineraryDay.operations.parking],
              ["Meals", itineraryDay.operations.meals],
              ["Rest and recovery", itineraryDay.operations.restAndRecovery],
              ["Reservations and tickets", itineraryDay.operations.reservationsAndTickets],
            ].map(([label, values]) => (
              <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <h3 className="font-bold">{label as string}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-400">
                  {(values as string[]).map((value) => <li key={value}>• {value}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TripLogisticsPanel
        logistics={logistics}
        dayDate={itineraryDay.date}
        currency={currency}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-300">
            Daily estimate
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight">
            Budget breakdown
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Transportation",
              value: itineraryDay.dailyBudget.transportation,
            },
            {
              label: "Attractions",
              value: itineraryDay.dailyBudget.attractions,
            },
            {
              label: "Food",
              value: itineraryDay.dailyBudget.food,
            },
            {
              label: "Lodging",
              value: itineraryDay.dailyBudget.lodging,
            },
            {
              label: "Miscellaneous",
              value: itineraryDay.dailyBudget.miscellaneous,
            },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-white">
                {formatBudget(item.value, currency)}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-7">
          <span className="font-semibold text-emerald-100">
            Estimated daily total
          </span>

          <span className="text-3xl font-black text-emerald-300">
            {formatBudget(itineraryDay.dailyBudget.total, currency)}
          </span>
        </div>

        <nav className="mt-20 flex flex-col gap-4 border-t border-white/10 pt-10 sm:flex-row sm:justify-between">
          {previousDay ? (
            <Link
              href={`/trips/${tripId}/day/${previousDay.day}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 transition hover:border-cyan-300/50 hover:bg-white/10"
            >
              <span className="block text-sm text-gray-400">
                ← Previous day
              </span>
              <span className="mt-1 block font-bold">
                {previousDay.title}
              </span>
            </Link>
          ) : (
            <div />
          )}

          {nextDay ? (
            <Link
              href={`/trips/${tripId}/day/${nextDay.day}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-right transition hover:border-cyan-300/50 hover:bg-white/10"
            >
              <span className="block text-sm text-gray-400">
                Next day →
              </span>
              <span className="mt-1 block font-bold">
                {nextDay.title}
              </span>
            </Link>
          ) : (
            <Link
              href="/#journey"
              className="rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-6 py-5 text-right transition hover:bg-cyan-400 hover:text-black"
            >
              <span className="block text-sm">Journey complete</span>
              <span className="mt-1 block font-bold">
                Return to itinerary →
              </span>
            </Link>
          )}
        </nav>
      </section>
    </main>
  );
}
