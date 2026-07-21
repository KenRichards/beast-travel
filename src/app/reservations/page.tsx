import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { loadApprovedReservations } from "@/lib/import/persistence/reservations";
import {
  reservationPrimaryDateRange,
  reservationProvider,
} from "@/lib/import/presentation";

export const metadata: Metadata = {
  title: "Approved Reservations | BEAST Travel",
  description: "Review approved imported reservations.",
};

export default async function ReservationsPage() {
  await connection();
  const loaded = await loadApprovedReservations();

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(167,139,250,0.17),_transparent_38%)]">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10 lg:px-12">
          <div className="flex flex-wrap justify-between gap-4">
            <Link href="/travel-inbox" className="font-bold text-cyan-200">← Travel Inbox</Link>
            <Link href="/trips/switzerland-2026/logistics" className="font-bold text-violet-200">Trip logistics</Link>
          </div>
          <p className="mt-12 text-sm font-bold uppercase tracking-[0.28em] text-violet-300">Private runtime data</p>
          <h1 className="mt-4 text-5xl font-black">Approved reservations</h1>
          <p className="mt-5 max-w-2xl leading-7 text-neutral-300">
            Approved normalized JSON records. Source documents stay in the
            Travel Inbox and tracked itinerary data remains unchanged.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-12">
        {loaded.malformedFiles.length ? (
          <p className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-4 text-amber-100">
            {loaded.malformedFiles.length} malformed reservation record
            {loaded.malformedFiles.length === 1 ? " was" : "s were"} skipped safely.
          </p>
        ) : null}
        {loaded.reservations.length ? (
          <div className="overflow-x-auto rounded-3xl border border-white/10">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-neutral-500">
                <tr><th className="px-6 py-4">Type</th><th className="px-6 py-4">Provider</th><th className="px-6 py-4">Date range</th><th className="px-6 py-4">Confirmation</th><th className="px-6 py-4">Source</th><th className="px-6 py-4">Updated</th><th className="px-6 py-4" /></tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loaded.reservations.map((reservation) => (
                  <tr key={reservation.id} className="bg-white/[0.025]">
                    <td className="px-6 py-5 font-bold capitalize">{reservation.type}</td>
                    <td className="px-6 py-5">{reservationProvider(reservation)}</td>
                    <td className="px-6 py-5 text-sm text-neutral-300">{reservationPrimaryDateRange(reservation)}</td>
                    <td className="px-6 py-5 font-mono text-sm">{reservation.confirmationNumber ?? "Not provided"}</td>
                    <td className="px-6 py-5 text-sm">{reservation.sourceFilename}</td>
                    <td className="px-6 py-5 text-sm">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(reservation.modifiedAt))}</td>
                    <td className="px-6 py-5 text-right"><Link href={`/reservations/${reservation.id}`} className="font-bold text-cyan-200">Open →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center">
            <h2 className="text-2xl font-bold">No approved reservations</h2>
            <p className="mt-3 text-neutral-400">Extract a document in the Travel Inbox and approve its review form.</p>
          </div>
        )}
      </section>
    </main>
  );
}
