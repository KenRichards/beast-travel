import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import TravelInbox from "@/components/import/TravelInbox";
import { listIncomingDocuments } from "@/lib/import/documents";

export const metadata: Metadata = {
  title: "Travel Inbox | BEAST Travel",
  description: "Import reservation PDFs into normalized travel data.",
};

export default async function TravelInboxPage() {
  await connection();
  const documents = await listIncomingDocuments();

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_38%)]">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10 lg:px-12 lg:py-20">
          <div className="flex items-center justify-between gap-6">
            <Link
              href="/"
              className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300 transition hover:text-cyan-200"
            >
              BEAST Travel
            </Link>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-300">
              Phase 1
            </span>
          </div>

          <div className="mt-16 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">
              Reservation imports
            </p>
            <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-6xl">
              Travel Inbox
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-300">
              Select a local reservation PDF to classify it, run the matching
              provider parser, and preview normalized JSON. Imports are
              read-only in this milestone.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
        <TravelInbox documents={documents} />

        <div className="mt-8 grid gap-4 text-sm text-neutral-400 sm:grid-cols-3">
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <strong className="block text-neutral-200">PDF only</strong>
            OCR and image imports are outside Phase 1.
          </p>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <strong className="block text-neutral-200">Preview only</strong>
            Parsed reservations are not persisted yet.
          </p>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <strong className="block text-neutral-200">Itinerary safe</strong>
            The existing journey is never updated by this flow.
          </p>
        </div>
      </section>
    </main>
  );
}
