import Image from "next/image";

export default function Home() {
  return (
    <main className="relative h-screen overflow-hidden bg-black text-white">

      {/* Background */}
      <Image
        src="/images/switzerland-hero.jpg"
        alt="Grindelwald, Switzerland"
        fill
        priority
        className="object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/70" />

      {/* Navigation */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-12 py-8">

        <div className="text-sm font-semibold tracking-[0.45em] text-cyan-300">
          BEAST TRAVEL
        </div>

        <nav className="hidden gap-10 text-sm text-gray-200 md:flex">
          <a href="#">Journey</a>
          <a href="#">Destinations</a>
          <a href="#">Budget</a>
          <a href="#">Gallery</a>
        </nav>

      </header>

      {/* Hero */}
      <section className="relative z-10 flex h-full items-end pb-32">

        <div className="mx-auto max-w-6xl px-12">

          <p className="mb-6 text-lg uppercase tracking-[0.35em] text-cyan-300">
            Switzerland • July 22–29, 2026
          </p>

          <h1 className="max-w-4xl text-7xl font-black leading-none md:text-8xl">
            The Richards Family Adventure
          </h1>

          <p className="mt-8 max-w-2xl text-xl leading-9 text-gray-200">
            Seven unforgettable days through alpine villages,
            glaciers, waterfalls, scenic railways,
            and some of the most spectacular landscapes on Earth.
          </p>

          <div className="mt-12 flex gap-6">

            <button className="rounded-full bg-cyan-500 px-8 py-4 text-lg font-semibold transition hover:bg-cyan-400">
              Begin the Adventure
            </button>

            <button className="rounded-full border border-white/30 bg-white/10 px-8 py-4 backdrop-blur-md transition hover:bg-white/20">
              View Itinerary
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}
