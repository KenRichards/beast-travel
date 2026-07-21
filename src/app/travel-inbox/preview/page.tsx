import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import ReservationPreview from "@/components/import/ReservationPreview";
import { DocumentAnalysisError } from "@/lib/import/analyzer/types";
import {
  parseReservationDocument,
  type ReservationImportResult,
} from "@/lib/import/parser";

export const metadata: Metadata = {
  title: "Reservation Preview | BEAST Travel",
  description: "Preview a normalized reservation import.",
};

interface ReservationPreviewPageProps {
  searchParams: Promise<{
    file?: string | string[];
  }>;
}

export default async function ReservationPreviewPage({
  searchParams,
}: ReservationPreviewPageProps) {
  await connection();
  const fileParameter = (await searchParams).file;
  const filename = Array.isArray(fileParameter)
    ? fileParameter[0]
    : fileParameter;

  if (!filename) {
    return (
      <ImportMessage
        title="Choose a document first"
        message="Return to the Travel Inbox and select a reservation PDF to import."
      />
    );
  }

  let result: ReservationImportResult;

  try {
    result = await parseReservationDocument(filename);
  } catch (error) {
    return (
      <ImportMessage
        title="This document cannot be imported"
        message={
          error instanceof DocumentAnalysisError
            ? error.message
            : "The document analysis service could not process this PDF."
        }
      />
    );
  }

  return <ReservationPreview result={result} />;
}

function ImportMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-300">
          Import unavailable
        </p>
        <h1 className="mt-4 text-3xl font-black">{title}</h1>
        <p className="mt-4 leading-7 text-neutral-400">{message}</p>
        <Link
          href="/travel-inbox"
          className="mt-8 inline-flex rounded-full bg-cyan-300 px-6 py-3 font-bold text-neutral-950 transition hover:bg-cyan-200"
        >
          Back to Travel Inbox
        </Link>
      </div>
    </main>
  );
}
