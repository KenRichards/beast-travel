import type { ImportDocument } from "./parser";
import type { ReservationType } from "./reservation";

export type ProviderHint =
  | "generic-hotel-pdf"
  | "generic-rental-car-pdf"
  | "generic-flight-pdf";

export interface DocumentClassification {
  type: ReservationType;
  providerHint: ProviderHint;
  confidence: number;
  signals: string[];
}

const TYPE_SIGNALS: ReadonlyArray<{
  type: ReservationType;
  providerHint: ProviderHint;
  terms: readonly string[];
}> = [
  {
    type: "rental-car",
    providerHint: "generic-rental-car-pdf",
    terms: ["rental", "rent-a-car", "car-hire", "vehicle", "hertz", "avis"],
  },
  {
    type: "flight",
    providerHint: "generic-flight-pdf",
    terms: ["flight", "airline", "airways", "boarding", "delta", "united"],
  },
  {
    type: "hotel",
    providerHint: "generic-hotel-pdf",
    terms: ["hotel", "lodging", "cottage", "resort", "inn", "suite"],
  },
];

export class UnsupportedImportDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedImportDocumentError";
  }
}

export function classifyDocument(
  document: ImportDocument,
): DocumentClassification {
  if (document.extension.toLowerCase() !== ".pdf") {
    throw new UnsupportedImportDocumentError(
      "Phase 1 supports PDF reservation documents only.",
    );
  }

  const normalizedName = document.filename.toLowerCase().replaceAll("_", "-");

  for (const candidate of TYPE_SIGNALS) {
    const matches = candidate.terms.filter((term) =>
      normalizedName.includes(term),
    );

    if (matches.length > 0) {
      return {
        type: candidate.type,
        providerHint: candidate.providerHint,
        confidence: Math.min(0.95, 0.72 + matches.length * 0.08),
        signals: matches.map((match) => `filename:${match}`),
      };
    }
  }

  return {
    type: "hotel",
    providerHint: "generic-hotel-pdf",
    confidence: 0.25,
    signals: ["phase-1:generic-pdf-fallback"],
  };
}
