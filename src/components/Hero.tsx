import Image from "next/image";
import Link from "next/link";

import TripNavigation from "@/components/trip/TripNavigation";

export default function Hero() {
  return (
    <section className="relative h-screen overflow-hidden text-white">

      <Image
        src="/images/switzerland-hero.jpg"
        alt="Grindelwald"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/75" />

      <header className="absolute inset-x-0 top-0 z-20 flex flex-col gap-5 px-6 py-6 sm:px-12 sm:py-8 md:flex-row md:items-center md:justify-between">

        <div className="text-sm font-semibold tracking-[0.45em] text-cyan-300">
          BEAST TRAVEL
        </div>

        <TripNavigation compact />

      </header>

      <div className="relative z-10 flex h-full items-end">

        <div className="mx-auto mb-28 max-w-6xl px-12">

          <p className="mb-5 uppercase tracking-[0.35em] text-cyan-300">
            Switzerland • July 22–29, 2026
          </p>

          <h1 className="max-w-4xl text-6xl font-black leading-none md:text-8xl">
            The Richards Family Adventure
          </h1>

          <p className="mt-8 max-w-2xl text-xl leading-9 text-gray-200">
            Seven unforgettable days exploring Switzerland&apos;s
            mountains, villages, glaciers and unforgettable scenery.
          </p>

          <div className="mt-12 flex flex-wrap gap-4">

            <a
              href="#journey"
              className="rounded-full bg-cyan-500 px-8 py-4 text-lg font-semibold transition hover:bg-cyan-400"
            >
              Begin the Adventure
            </a>

            <Link
              href="/today"
              className="rounded-full border border-white/30 bg-white/10 px-8 py-4 font-semibold backdrop-blur"
            >
              Open Today
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}
