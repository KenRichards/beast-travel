import Image from "next/image";
import Link from "next/link";

import type { ItineraryDay } from "@/types/itinerary";

interface DestinationCardProps {
  day: ItineraryDay;
  tripId?: string;
}

export default function DestinationCard({
  day,
  tripId = "switzerland-2026",
}: DestinationCardProps) {
  return (
    <article
      className="
        group overflow-hidden rounded-3xl border border-white/10
        bg-white/5 shadow-2xl shadow-black/20 backdrop-blur
        transition-all duration-300 hover:-translate-y-1
        hover:border-cyan-400/60 hover:bg-white/10
        hover:shadow-cyan-500/10
      "
    >
      <div className="relative h-72 overflow-hidden sm:h-80 lg:h-96">
        <Image
          src={day.image}
          alt={`${day.title}, ${day.location}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px"
          className="
            object-cover transition-transform duration-700 ease-out
            group-hover:scale-110
          "
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Day {day.day}
              </p>

              <h3 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                {day.title}
              </h3>

              <p className="mt-2 text-base text-gray-200 sm:text-lg">
                {day.location}
              </p>
            </div>

            <span
              aria-hidden="true"
              className="
                hidden rounded-2xl border border-white/20 bg-black/30
                p-4 text-4xl backdrop-blur-md sm:block
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
          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/15 px-4 py-2 text-cyan-200">
            {day.transport}
          </span>

          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-gray-200">
            {day.travelTime}
          </span>

          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-4 py-2 text-emerald-200">
            ${day.budget}
          </span>
        </div>

        <Link
          href={`/trips/${tripId}/day/${day.day}`}
          className="
            mt-8 inline-flex items-center rounded-full
            border border-cyan-400 px-6 py-3 font-semibold
            text-cyan-200 transition-all hover:bg-cyan-400
            hover:text-black focus-visible:outline
            focus-visible:outline-2 focus-visible:outline-offset-4
            focus-visible:outline-cyan-400
          "
        >
          Explore Day
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
