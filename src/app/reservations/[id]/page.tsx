import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getIncomingDocument } from "@/lib/import/documents";
import { loadReservationById } from "@/lib/import/persistence/reservations";
import { reservationPrimaryDateRange } from "@/lib/import/presentation";

export const metadata: Metadata = {
  title: "Reservation Details | BEAST Travel",
};

interface ReservationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  await connection();
  const { id } = await params;
  const reservation = await loadReservationById(id);
  if (!reservation) notFound();
  const sourceExists = (await getIncomingDocument(reservation.sourceFilename)) !== null;

  const details: Array<[string, unknown]> = reservation.type === "hotel"
    ? Object.entries(reservation.hotel)
    : reservation.type === "rental-car"
      ? Object.entries(reservation.rentalCar)
      : [
          ["airline", reservation.flight.airline],
          ["bookingReference", reservation.flight.bookingReference],
          ["segments", reservation.flight.segments.map((segment) => [segment.departureAirport, segment.arrivalAirport, segment.flightNumber].filter(Boolean).join(" → ")).join("; ")],
        ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10 lg:px-12">
        <div className="flex flex-wrap justify-between gap-4">
          <Link href="/reservations" className="font-bold text-cyan-200">← Approved reservations</Link>
          {sourceExists ? (
            <Link href={{ pathname: "/travel-inbox/preview", query: { file: reservation.sourceFilename } }} prefetch={false} className="rounded-full bg-violet-300 px-5 py-2 font-bold text-neutral-950">Edit and reapprove</Link>
          ) : null}
        </div>
        <p className="mt-12 text-sm font-bold uppercase tracking-[0.28em] text-violet-300">Approved · Imported</p>
        <h1 className="mt-4 text-4xl font-black capitalize sm:text-5xl">{reservation.type} reservation</h1>
        <p className="mt-4 text-neutral-300">{reservationPrimaryDateRange(reservation)}</p>

        {!sourceExists ? <p className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-4 text-amber-100">The originating PDF is no longer available in the Travel Inbox. The approved record remains readable.</p> : null}

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <dl className="grid gap-5 sm:grid-cols-2">
            <Detail label="Provider" value={reservation.provider} />
            <Detail label="Confirmation number" value={reservation.confirmationNumber} />
            <Detail label="Source filename" value={reservation.sourceFilename} />
            <Detail label="Extraction source" value={reservation.source.extractionMethod} />
            <Detail label="Approved" value={new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(reservation.approvedAt))} />
            <Detail label="Travelers" value={reservation.travelers.join(", ") || null} />
          </dl>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Reservation details</h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <Detail key={label} label={label.replace(/([a-z])([A-Z])/g, "$1 $2")} value={Array.isArray(value) ? value.join(", ") : value === null ? null : String(value)} />
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div className="rounded-2xl bg-black/20 p-4"><dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</dt><dd className="mt-2 break-words font-semibold">{value || "Not provided"}</dd></div>;
}
