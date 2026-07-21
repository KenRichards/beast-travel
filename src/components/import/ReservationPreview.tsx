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
  unknown: "Unknown",
} as const;

const recognitionLabels = {
  "recognized-supported": "Recognized · supported",
  "recognized-unsupported": "Recognized · unsupported",
  unknown: "Unknown",
} as const;

function formatDate(value: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unit = units[0];

  for (let index = 1; size >= 1024 && index < units.length; index += 1) {
    size /= 1024;
    unit = units[index];
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${unit}`;
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
  const { analysis, classification } = result;
  const pdfMetadata = analysis.metadata.pdf;
  const metadataFacts = [
    ["Title", pdfMetadata.title],
    ["Author", pdfMetadata.author],
    ["Subject", pdfMetadata.subject],
    ["Creator", pdfMetadata.creator],
    ["Producer", pdfMetadata.producer],
    [
      "Created",
      pdfMetadata.creationDate
        ? formatDate(pdfMetadata.creationDate)
        : undefined,
    ],
    [
      "Modified in PDF",
      pdfMetadata.modificationDate
        ? formatDate(pdfMetadata.modificationDate)
        : undefined,
    ],
    ["PDF version", pdfMetadata.pdfVersion],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

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
                Document analysis
              </p>
              <h1 className="mt-4 max-w-3xl break-words text-4xl font-black tracking-tight sm:text-5xl">
                {result.document.filename}
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-neutral-300">
                The PDF was analyzed locally. Extracted document text is used
                only for classification and is not shown in this preview.
              </p>
            </div>
            <span className="w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
              {result.status === "parsed"
                ? "Mock parsed data"
                : recognitionLabels[classification.recognitionStatus]}
            </span>
          </div>

          <ol
            className="mt-10 grid gap-2 text-sm sm:grid-cols-5"
            aria-label="Import pipeline"
          >
            {[
              "Document",
              "PDF analysis",
              "Classifier",
              "Provider parser",
              "Normalized JSON",
            ].map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3 font-semibold text-cyan-100"
              >
                <span className="grid size-6 place-items-center rounded-full bg-cyan-300 text-xs font-black text-neutral-950">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[1.25fr_0.75fr] lg:px-12 lg:py-16">
        <div className="space-y-8">
          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2">
            <PreviewFact
              label="Probable reservation type"
              value={typeLabels[classification.probableType]}
            />
            <PreviewFact
              label="Probable provider"
              value={classification.probableProvider?.name ?? "Unknown"}
            />
            <PreviewFact
              label="Confidence"
              value={`${formatFieldName(classification.confidence)} (${Math.round(classification.confidenceScore * 100)}%)`}
            />
            <PreviewFact
              label="Recognition status"
              value={recognitionLabels[classification.recognitionStatus]}
            />
          </div>

          {result.status !== "parsed" ? (
            <section
              className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.07] p-6 sm:p-8"
              aria-live="polite"
            >
              <h2 className="text-2xl font-bold text-amber-100">
                {result.status === "unsupported"
                  ? "Provider not supported"
                  : "Document not recognized"}
              </h2>
              <p className="mt-3 leading-7 text-amber-50/75">
                {result.message}
              </p>
              <p className="mt-3 text-sm text-amber-100/50">
                The document was not changed and no reservation was saved.
              </p>
            </section>
          ) : null}

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Document facts</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <DocumentFact label="Filename" value={analysis.metadata.filename} />
              <DocumentFact
                label="Size"
                value={formatFileSize(analysis.metadata.fileSize)}
              />
              <DocumentFact
                label="Pages"
                value={String(pdfMetadata.pageCount)}
              />
              <DocumentFact label="MIME type" value={analysis.metadata.mimeType} />
              <DocumentFact
                label="Filesystem modified"
                value={formatDate(analysis.metadata.filesystemModifiedAt)}
              />
              <DocumentFact
                label="Text extraction"
                value={
                  analysis.textExtraction.status === "extracted"
                    ? `Available (${analysis.textExtraction.characterCount.toLocaleString()} character sample${analysis.textExtraction.truncated ? ", truncated" : ""})`
                    : "No extractable text (possibly image-only)"
                }
              />
            </dl>
            <div className="mt-4 rounded-2xl bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                SHA-256 fingerprint
              </p>
              <p className="mt-2 break-all font-mono text-sm text-neutral-200">
                <abbr
                  title={analysis.metadata.sha256}
                  aria-label={`Full SHA-256 fingerprint ${analysis.metadata.sha256}`}
                  className="no-underline"
                >
                  {analysis.metadata.sha256.slice(0, 16)}…
                </abbr>
              </p>
            </div>
          </section>

          {result.status === "parsed" ? (
            <>
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                <h2 className="text-2xl font-bold">Dates</h2>
                <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-neutral-500">Starts</dt>
                    <dd className="mt-2 font-semibold">
                      {formatDate(
                        result.reservation.dates.start,
                        result.reservation.dates.timeZone,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-neutral-500">Ends</dt>
                    <dd className="mt-2 font-semibold">
                      {formatDate(
                        result.reservation.dates.end,
                        result.reservation.dates.timeZone,
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="mt-5 text-xs text-neutral-500">
                  Time zone: {result.reservation.dates.timeZone}
                </p>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                <h2 className="text-2xl font-bold">Mock parsed fields</h2>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  {Object.entries(result.reservation.parsedFields).map(
                    ([name, value]) => (
                      <DocumentFact
                        key={name}
                        label={formatFieldName(name)}
                        value={formatFieldValue(value)}
                      />
                    ),
                  )}
                </dl>
              </section>

              <details className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                <summary className="cursor-pointer list-none text-xl font-bold marker:hidden">
                  Mock normalized reservation JSON
                  <span className="float-right text-cyan-300 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <pre className="mt-6 overflow-x-auto rounded-2xl bg-black/40 p-5 text-xs leading-6 text-cyan-100">
                  {JSON.stringify(result.reservation, null, 2)}
                </pre>
              </details>
            </>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-bold">PDF metadata</h2>
            {metadataFacts.length > 0 ? (
              <dl className="mt-5 space-y-4 text-sm">
                {metadataFacts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-neutral-500">{label}</dt>
                    <dd className="mt-1 break-words font-semibold text-neutral-200">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-6 text-neutral-500">
                No optional PDF metadata was provided.
              </p>
            )}
          </section>

          {result.status === "parsed" ? (
            <>
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-bold">Mock travelers</h2>
                <ul className="mt-5 space-y-4">
                  {result.reservation.travelers.map((traveler) => (
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
                          <p className="text-sm text-neutral-500">
                            {traveler.role}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-bold">Mock location</h2>
                <address className="mt-5 space-y-1 not-italic leading-7 text-neutral-300">
                  {formatLocation(result.reservation.location).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </address>
              </section>

              <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-6">
                <h2 className="text-lg font-bold text-cyan-100">
                  Parser details
                </h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-cyan-200/60">Provider parser</dt>
                    <dd className="mt-1 font-semibold text-cyan-50">
                      {result.parser.displayName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-cyan-200/60">Parser ID</dt>
                    <dd className="mt-1 font-mono text-xs text-cyan-50">
                      {result.parser.id}
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
            </>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-950 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function DocumentFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </dt>
      <dd className="mt-2 break-words font-semibold text-neutral-100">
        {value}
      </dd>
    </div>
  );
}
