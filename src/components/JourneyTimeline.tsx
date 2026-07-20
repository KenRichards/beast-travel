import DestinationCard from "@/components/DestinationCard";
import { getItinerary } from "@/lib/itinerary";

export default function JourneyTimeline() {
  const { days } = getItinerary();

  return (
    <section
      id="journey"
      className="bg-neutral-950 py-32 text-white"
    >
      <div className="mx-auto max-w-6xl px-8">

        <h2 className="mb-16 text-5xl font-black">
          Your Journey
        </h2>

        <div className="space-y-10">
          {days.map((day) => (
            <DestinationCard
              key={day.day}
              day={day}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
