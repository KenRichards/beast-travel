const days = [
  {
    day: "Day 1",
    icon: "✈️",
    title: "Arrive in Zürich",
    description: "Land in Switzerland and begin your family adventure."
  },
  {
    day: "Day 2",
    icon: "🚞",
    title: "Lucerne",
    description: "Historic bridges, lakeside promenades and mountain scenery."
  },
  {
    day: "Day 3",
    icon: "🏔️",
    title: "Grindelwald",
    description: "The heart of the Bernese Alps."
  },
  {
    day: "Day 4",
    icon: "🚠",
    title: "Jungfraujoch",
    description: "Journey to the Top of Europe."
  }
];

export default function JourneyTimeline() {
  return (
    <section id="journey" className="bg-neutral-950 py-32 text-white">
      <div className="mx-auto max-w-6xl px-8">
        <h2 className="mb-16 text-5xl font-black">Your Journey</h2>

        <div className="space-y-8">
          {days.map((d) => (
            <div
              key={d.day}
              className="rounded-3xl border border-white/10 bg-white/5 p-10 transition duration-300 hover:scale-[1.02] hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl">{d.icon}</span>

                <div>
                  <p className="text-cyan-400">{d.day}</p>
                  <h3 className="text-3xl font-bold">{d.title}</h3>
                </div>
              </div>

              <p className="mt-6 max-w-2xl text-lg text-gray-300">
                {d.description}
              </p>

              <button className="mt-8 rounded-full border border-cyan-400 px-6 py-3 text-cyan-300 transition hover:bg-cyan-400 hover:text-black">
                Explore this Day →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
