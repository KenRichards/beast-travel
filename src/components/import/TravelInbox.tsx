import Link from "next/link";

import type { PublicDocumentAnalysis } from "@/lib/import/analyzer/types";
import type { ImportDocument } from "@/lib/import/parser";

export interface InboxDocument {
  document: ImportDocument;
  analysis?: PublicDocumentAnalysis;
  analysisError?: string;
  approvedReservationId?: string;
}

interface TravelInboxProps {
  documents: InboxDocument[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unit = units[0];

  for (let index = 1; size >= 1024 && index < units.length; index += 1) {
    size /= 1024;
    unit = units[index];
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${unit}`;
}

function formatLastModified(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Detroit",
  }).format(new Date(value));
}

export default function TravelInbox({ documents }: TravelInboxProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h2 className="text-xl font-bold text-white">Incoming documents</h2>
          <p className="mt-1 text-sm text-neutral-400">
            travel-data/incoming/
          </p>
        </div>
        <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
          {documents.length} {documents.length === 1 ? "document" : "documents"}
        </span>
      </div>

      {documents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.16em] text-neutral-500">
              <tr>
                <th className="px-8 py-4 font-semibold">Filename</th>
                <th className="px-6 py-4 font-semibold">Size</th>
                <th className="px-6 py-4 font-semibold">Last modified</th>
                <th className="px-8 py-4 text-right font-semibold">
                  Import
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {documents.map(({ document, analysis, analysisError, approvedReservationId }) => (
                <tr
                  key={document.filename}
                  className="transition-colors hover:bg-white/[0.04]"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <span
                        className="grid size-10 shrink-0 place-items-center rounded-xl border border-rose-300/20 bg-rose-300/10 text-xs font-black text-rose-200"
                        aria-hidden="true"
                      >
                        {document.extension.slice(1).toUpperCase() || "FILE"}
                      </span>
                      <span className="max-w-sm truncate font-semibold text-white">
                        {document.filename}
                      </span>
                    </div>
                    {analysis ? (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 pl-14 text-xs text-neutral-500">
                        <span>
                          {analysis.metadata.pdf.pageCount}{" "}
                          {analysis.metadata.pdf.pageCount === 1
                            ? "page"
                            : "pages"}
                        </span>
                        <span>
                          SHA-256:{" "}
                          <abbr
                            title={analysis.metadata.sha256}
                            aria-label={`SHA-256 fingerprint ${analysis.metadata.sha256}`}
                            className="font-mono no-underline"
                          >
                            {analysis.metadata.sha256.slice(0, 12)}…
                          </abbr>
                        </span>
                      </div>
                    ) : (
                      <p className="mt-3 pl-14 text-xs text-amber-300">
                        {analysisError ?? "Analysis unavailable"}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-5 text-sm text-neutral-300">
                    {formatFileSize(document.size)}
                  </td>
                  <td className="px-6 py-5 text-sm text-neutral-300">
                    {formatLastModified(document.lastModified)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link
                      href={{
                        pathname: "/travel-inbox/preview",
                        query: { file: document.filename },
                      }}
                      prefetch={false}
                      className="inline-flex rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                    >
                      {approvedReservationId ? "Review update" : "Extract & review"}
                    </Link>
                    {approvedReservationId ? (
                      <Link
                        href={`/reservations/${approvedReservationId}`}
                        className="mt-2 block text-xs font-bold text-violet-200 hover:text-violet-100"
                      >
                        Approved record
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-20 text-center sm:px-8">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-2xl">
            <span aria-hidden="true">↓</span>
          </div>
          <h3 className="mt-6 text-xl font-bold text-white">
            The Travel Inbox is empty
          </h3>
          <p className="mx-auto mt-3 max-w-md leading-7 text-neutral-400">
            Add a reservation PDF to travel-data/incoming/. It will appear here
            automatically and remain local to this environment.
          </p>
        </div>
      )}
    </div>
  );
}
