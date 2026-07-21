import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import TripLogisticsPanel from "@/components/trip/TripLogistics";
import { mergeImportedLogistics } from "@/lib/import/logistics";
import { loadApprovedReservations } from "@/lib/import/persistence/reservations";
import { getItinerary } from "@/lib/itinerary";

export const metadata: Metadata = {
  title: "Trip Logistics | BEAST Travel",
  description: "Manual and imported reservations for the trip.",
};

interface LogisticsPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function LogisticsPage({ params }: LogisticsPageProps) {
  await connection();
  const { tripId } = await params;
  const itinerary = getItinerary();
  if (tripId !== itinerary.trip.id) notFound();

  const approved = await loadApprovedReservations();
  const logistics = mergeImportedLogistics(
    itinerary.logistics,
    approved.reservations,
  );

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-6 sm:px-10 lg:px-12">
          <Link href="/" className="font-bold text-cyan-200">
            ← Journey
          </Link>
          <Link href="/reservations" className="font-bold text-violet-200">
            Manage imported reservations
          </Link>
        </div>
      </header>
      <TripLogisticsPanel
        logistics={logistics}
        currency={itinerary.trip.currency}
      />
    </main>
  );
}
