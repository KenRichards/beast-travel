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
        overflow-hidden
        rounded-3xl
        border border-white/10
        bg-white/5
        backdrop-blur
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-cyan-400/60
        hover:bg-white/10
        hover:shadow-2xl
        hover:shadow-cyan-500/10
      "
    >
      <div className="h-56 bg-gradient-to-br from-slate-700 via-slate-800 to-black flex items-center justify-center">
        <span className="text-7xl">{day.icon}</span>
      </div>

      <div className="p-8">

        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Day {day.day}
        </p>

        <h3 className="mt-2 text-3xl font-bold">
          {day.title}
        </h3>

        <p className="mt-2 text-cyan-300">
          {day.location}
        </p>

        <p className="mt-6 leading-7 text-gray-300">
          {day.description}
        </p>

        <button
          className="
            mt-8
            rounded-full
            border
            border-cyan-400
            px-6
            py-3
            text-cyan-300
            transition
            hover:bg-cyan-400
            hover:text-black
          "
        >
          Explore Day →
        </button>

      </div>
    </article>
  );
}
