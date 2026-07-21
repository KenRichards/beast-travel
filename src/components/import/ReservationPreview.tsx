import Link from "next/link";

import type { ReservationImportResult } from "@/lib/import/parser";
import type {
  ParsedFieldValue,
  ReservationLocation,
} from "@/lib/import/reservation";

interface ReservationPreviewProps {
  result: ReservationImportResult;
}

const typeLabels = {
  hotel: "Hotel",
  "rental-car": "Rental Car",
  flight: "Flight",
} as const;

function formatDate(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function formatFieldName(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatFieldValue(value: ParsedFieldValue): string {
  if (value === null) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function formatLocation(location: ReservationLocation): string[] {
  const locality = [location.city, location.region].filter(Boolean).join(", ");
  return [
    location.name,
    location.address,
    locality || undefined,
    location.country,
    location.iataCode ? `Airport: ${location.iataCode}` : undefined,
  ].filter((part): part is string => Boolean(part));
}

export default function ReservationPreview({
  result,
}: ReservationPreviewProps) {
  const { classification, parser, reservation } = result;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_36%)]">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
          <Link
            href="/travel-inbox"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-cyan-100"
          >
            <span aria-hidden="true">←</span> Back to Travel Inbox
          </Link>

          <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">
                Reservation preview
              </p>
              <h1 className="mt-4 max-w-3xl break-words text-4xl font-black tracking-tight sm:text-5xl">
                {result.document.filename}
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-neutral-300">
                Review the Phase 1 normalized output. Nothing has been saved or
                added to an itinerary.
              </p>
            </div>
            <span className="w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
              Mock parsed data
            </span>
          </div>

          <ol
            className="mt-10 grid gap-2 text-sm sm:grid-cols-4"
            aria-label="Import pipeline"
          >
            {["Document", "Classifier", "Provider parser", "Normalized JSON"].map(
              (step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3 font-semibold text-cyan-100"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-cyan-300 text-xs font-black text-neutral-950">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ),
            )}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[1.25fr_0.75fr] lg:px-12 lg:py-16">
        <div className="space-y-8">
          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2">
            <PreviewFact label="Reservation type" value={typeLabels[reservation.type]} />
            <PreviewFact label="Provider" value={reservation.provider} />
            <PreviewFact
              label="Confirmation number"
              value={reservation.confirmationNumber}
              mono
            />
            <PreviewFact
              label="Classification confidence"
              value={`${Math.round(classification.confidence * 100)}%`}
            />
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Dates</h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-neutral-500">Starts</dt>
                <dd className="mt-2 font-semibold">
                  {formatDate(reservation.dates.start, reservation.dates.timeZone)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Ends</dt>
                <dd className="mt-2 font-semibold">
                  {formatDate(reservation.dates.end, reservation.dates.timeZone)}
                </dd>
              </div>
            </dl>
            <p className="mt-5 text-xs text-neutral-500">
              Time zone: {reservation.dates.timeZone}
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Parsed fields</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {Object.entries(reservation.parsedFields).map(([name, value]) => (
                <div key={name} className="rounded-2xl bg-black/20 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    {formatFieldName(name)}
                  </dt>
                  <dd className="mt-2 font-semibold text-neutral-100">
                    {formatFieldValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <details className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <summary className="cursor-pointer list-none text-xl font-bold marker:hidden">
              Normalized reservation JSON
              <span className="float-right text-cyan-300 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <pre className="mt-6 overflow-x-auto rounded-2xl bg-black/40 p-5 text-xs leading-6 text-cyan-100">
              {JSON.stringify(reservation, null, 2)}
            </pre>
          </details>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-bold">Travelers</h2>
            <ul className="mt-5 space-y-4">
              {reservation.travelers.map((traveler) => (
                <li
                  key={`${traveler.firstName}-${traveler.lastName}`}
                  className="flex items-center gap-3"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-cyan-300/10 font-bold text-cyan-200">
                    {traveler.firstName[0]}
                    {traveler.lastName[0]}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {traveler.firstName} {traveler.lastName}
                    </p>
                    {traveler.role ? (
                      <p className="text-sm text-neutral-500">{traveler.role}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-bold">Location</h2>
            <address className="mt-5 space-y-1 not-italic leading-7 text-neutral-300">
              {formatLocation(reservation.location).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
          </section>

          <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-6">
            <h2 className="text-lg font-bold text-cyan-100">Parser details</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-cyan-200/60">Provider parser</dt>
                <dd className="mt-1 font-semibold text-cyan-50">
                  {parser.displayName}
                </dd>
              </div>
              <div>
                <dt className="text-cyan-200/60">Parser ID</dt>
                <dd className="mt-1 font-mono text-xs text-cyan-50">
                  {parser.id}
                </dd>
              </div>
              <div>
                <dt className="text-cyan-200/60">Classifier signals</dt>
                <dd className="mt-1 text-cyan-50">
                  {classification.signals.join(", ")}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>
    </main>
  );
}

function PreviewFact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-neutral-950 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className={`mt-2 text-lg font-bold ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}
