import Link from "next/link";

import ReservationReviewForm from "@/components/import/ReservationReviewForm";
import type { ReservationImportResult } from "@/lib/import/parser";
import type { ApprovedReservation } from "@/lib/import/reservation";
import { validateReservation } from "@/lib/import/validation/reservation";

interface ReservationPreviewProps {
  result: ReservationImportResult;
  existing: ApprovedReservation | null;
}

const typeLabels = {
  hotel: "Hotel",
  "rental-car": "Rental Car",
  flight: "Flight",
  unknown: "Unknown",
} as const;

const recognitionLabels = {
  "recognized-supported": "Recognized · supported",
  "recognized-unsupported": "Recognized · unsupported",
  unknown: "Unknown",
} as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ReservationPreview({
  result,
  existing,
}: ReservationPreviewProps) {
  const { analysis, classification } = result;
  const reservation = existing ?? (result.status === "parsed" ? result.reservation : null);
  const validation = reservation ? validateReservation(reservation) : null;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_36%)]">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/travel-inbox" className="font-bold text-cyan-200">
              ← Travel Inbox
            </Link>
            <Link href="/reservations" className="font-bold text-violet-200">
              Approved reservations
            </Link>
          </div>
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">
            Analysis and review
          </p>
          <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl">
            {result.document.filename}
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-neutral-300">
            Document text stays server-side. Review every uncertain field and
            explicitly approve before a private JSON record is written.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
        <section className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Type" value={typeLabels[classification.probableType]} />
          <Fact label="Provider" value={classification.probableProvider?.name ?? "Unknown"} />
          <Fact label="Recognition" value={recognitionLabels[classification.recognitionStatus]} />
          <Fact
            label="Text source"
            value={
              analysis.textExtraction.method === "local-ocr"
                ? "Local OCR"
                : analysis.textExtraction.method === "native-text"
                  ? "Native PDF text"
                  : "Unavailable"
            }
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold">Document analysis</h2>
              <p className="mt-2 text-sm text-neutral-400">
                No full extracted or OCR text is sent to this page.
              </p>
            </div>
            {existing ? (
              <Link
                href={`/reservations/${existing.id}`}
                className="rounded-full border border-violet-300/30 bg-violet-300/10 px-4 py-2 text-sm font-bold text-violet-200"
              >
                Existing approved record
              </Link>
            ) : null}
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DocumentFact label="Size" value={formatFileSize(analysis.metadata.fileSize)} />
            <DocumentFact label="Pages" value={String(analysis.metadata.pdf.pageCount)} />
            <DocumentFact label="Text characters" value={analysis.textExtraction.characterCount.toLocaleString()} />
            <DocumentFact label="Parser status" value={result.status} />
          </dl>
          {analysis.textExtraction.failure ? (
            <p className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-4 text-amber-100">
              Local OCR is unavailable for this document ({analysis.textExtraction.failure}).
            </p>
          ) : null}
        </section>

        {result.status !== "parsed" ? (
          <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.07] p-8">
            <h2 className="text-2xl font-bold text-amber-100">Review unavailable</h2>
            <p className="mt-3 text-amber-50/75">{result.message}</p>
            <p className="mt-2 text-sm text-amber-100/60">
              The source document was not changed and nothing was saved.
            </p>
          </section>
        ) : null}

        {reservation && validation ? (
          <ReservationReviewForm
            reservation={reservation}
            initialErrors={validation.errors}
            initialWarnings={validation.warnings}
            updating={existing !== null}
          />
        ) : null}
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-950 p-6">
      <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="mt-2 font-bold">{value}</dd>
    </div>
  );
}

function DocumentFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="mt-2 break-words font-semibold">{value}</dd>
    </div>
  );
}
