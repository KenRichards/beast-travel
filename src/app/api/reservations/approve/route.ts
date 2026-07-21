import { revalidatePath } from "next/cache";

import { analyzeIncomingDocument } from "@/lib/import/analyzer/analyzer";
import { DocumentAnalysisError } from "@/lib/import/analyzer/types";
import {
  approveReservation,
  ReservationPersistenceError,
} from "@/lib/import/persistence/reservations";
import { validateReservation } from "@/lib/import/validation/reservation";
import { parseReservationDraft } from "@/lib/import/validation/schema";

const MAX_APPROVAL_BODY_BYTES = 128 * 1024;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_APPROVAL_BODY_BYTES) {
    return Response.json(
      { message: "The approval request is too large." },
      { status: 413 },
    );
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json(
      { message: "The approval request is not valid JSON." },
      { status: 400 },
    );
  }

  const reservation = parseReservationDraft(input);
  if (!reservation) {
    return Response.json(
      { message: "The reservation data is not valid." },
      { status: 400 },
    );
  }

  const validation = validateReservation(reservation);
  if (!validation.valid) {
    return Response.json(
      {
        message: "Correct the highlighted fields before approval.",
        errors: validation.errors,
        warnings: validation.warnings,
      },
      { status: 422 },
    );
  }

  try {
    const source = await analyzeIncomingDocument(reservation.sourceFilename);
    if (source.metadata.sha256 !== reservation.documentFingerprint) {
      return Response.json(
        { message: "The source document changed. Run extraction again before approval." },
        { status: 409 },
      );
    }

    const result = await approveReservation(reservation);
    revalidatePath("/reservations");
    revalidatePath(`/reservations/${result.reservation.id}`);
    revalidatePath("/trips/[tripId]/day/[day]", "page");

    return Response.json({
      id: result.reservation.id,
      updated: result.updated,
      message: result.updated
        ? "Reservation updated and reapproved."
        : "Reservation approved and saved.",
    });
  } catch (error) {
    const message =
      error instanceof DocumentAnalysisError ||
      error instanceof ReservationPersistenceError
        ? error.message
        : "The reservation could not be approved safely.";
    return Response.json({ message }, { status: 500 });
  }
}
