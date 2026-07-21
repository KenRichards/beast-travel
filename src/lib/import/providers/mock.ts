import type { DocumentClassification } from "../classifier";
import type { ImportDocument } from "../parser";
import type { ReservationSource } from "../reservation";

export const mockTravelers = [
  { firstName: "Alex", lastName: "Traveler", role: "Primary guest" },
];

export function createMockConfirmation(
  prefix: string,
  document: ImportDocument,
): string {
  const stem = document.filename.replace(/\.[^.]+$/, "");
  const token = stem.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8);
  return `${prefix}-${token || "DEMO"}-021`;
}

export function createReservationSource(
  parserId: string,
  document: ImportDocument,
  classification: DocumentClassification,
): ReservationSource {
  return {
    filename: document.filename,
    size: document.size,
    lastModified: document.lastModified,
    parserId,
    classificationConfidence: classification.confidence,
  };
}
