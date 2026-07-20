import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getItinerary, getItineraryDay } from "@/lib/itinerary";

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

export default async function DayPage({ params }: DayPageProps) {
  const { tripId, day } = await params;
  const dayNumber = Number(day);
  const itinerary = getItinerary();
  const itineraryDay = getItineraryDay(tripId, dayNumber);

  if (!Number.isInteger(dayNumber) || !itineraryDay) {
    notFound();
  }

  const previousDay = itinerary.days.find(
    (entry) => entry.day === dayNumber - 1,
  );

  const nextDay = itinerary.days.find(
    (entry) => entry.day === dayNumber + 1,
  );

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

              <div className="mt-8 space-y-6">
                <div className="flex gap-5">
                  <span className="text-3xl" aria-hidden="true">
                    ☀️
                  </span>
                  <div>
                    <p className="font-semibold text-white">Morning</p>
                    <p className="mt-1 text-gray-400">
                      Start the day at a relaxed pace and travel to the main destination.
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
                      Explore the destination, scenery, landmarks, and local experiences.
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
                      Enjoy dinner and a flexible evening near the hotel or town center.
                    </p>
                  </div>
                </div>
              </div>
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
                  <dt className="text-sm text-gray-500">Estimated budget</dt>
                  <dd className="mt-1 text-lg font-semibold text-emerald-300">
                    ${itineraryDay.budget}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                Travel note
              </p>

              <p className="mt-4 leading-7 text-cyan-50/80">
                Detailed reservations, train schedules, restaurants, maps, and packing notes will be added here in upcoming milestones.
              </p>
            </div>
          </aside>
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
