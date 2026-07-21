import type { AnalyzedDocument } from "./analyzer/types";
import type { ReservationType } from "./reservation";

export type ProbableReservationType = ReservationType | "unknown";
export type ClassificationConfidence =
  | "high"
  | "medium"
  | "low"
  | "unknown";
export type RecognitionStatus =
  | "recognized-supported"
  | "recognized-unsupported"
  | "unknown";

export interface ProbableProvider {
  id: string;
  name: string;
}

export interface DocumentClassification {
  probableType: ProbableReservationType;
  probableProvider: ProbableProvider | null;
  confidence: ClassificationConfidence;
  confidenceScore: number;
  recognitionStatus: RecognitionStatus;
  signals: string[];
}

type ClassifiableDocument = Pick<AnalyzedDocument, "document" | "metadata" | "text">;
type ProviderSupportResolver = (
  classification: Omit<DocumentClassification, "recognitionStatus">,
) => boolean;

const TYPE_SIGNALS: ReadonlyArray<{
  type: ReservationType;
  terms: readonly string[];
}> = [
  {
    type: "rental-car",
    terms: [
      "rental car",
      "car rental",
      "rent a car",
      "vehicle rental",
      "rental vehicle",
      "pick up",
      "pickup",
      "drop off",
      "dropoff",
      "car hire",
      "driver",
    ],
  },
  {
    type: "flight",
    terms: [
      "flight",
      "airline",
      "boarding pass",
      "e ticket",
      "itinerary receipt",
      "departure airport",
      "arrival airport",
      "passenger",
      "baggage",
    ],
  },
  {
    type: "hotel",
    terms: [
      "hotel",
      "lodging",
      "accommodation",
      "check in",
      "check out",
      "room",
      "guest",
      "property",
      "cottage",
      "resort",
      "inn",
    ],
  },
];

const PROVIDER_SIGNALS: ReadonlyArray<{
  provider: ProbableProvider;
  patterns: readonly RegExp[];
}> = [
  {
    provider: { id: "booking-com", name: "Booking.com" },
    patterns: [/\bbooking\.com/i],
  },
  {
    provider: { id: "air-canada", name: "Air Canada" },
    patterns: [/\bair\s+canada\b/i, /\baircanada\.com\b/i],
  },
  {
    provider: { id: "expedia", name: "Expedia" },
    patterns: [/\bexpedia\b/i],
  },
  {
    provider: { id: "airbnb", name: "Airbnb" },
    patterns: [/\bairbnb\b/i],
  },
  {
    provider: { id: "vrbo", name: "Vrbo" },
    patterns: [/\bvrbo\b/i],
  },
  {
    provider: { id: "delta", name: "Delta Air Lines" },
    patterns: [/\bdelta\s+air\s+lines\b/i, /\bdelta\.com\b/i],
  },
  {
    provider: { id: "united", name: "United Airlines" },
    patterns: [/\bunited\s+airlines\b/i, /\bunited\.com\b/i],
  },
  {
    provider: { id: "hertz", name: "Hertz" },
    patterns: [/\bhertz\b/i],
  },
  {
    provider: { id: "avis", name: "Avis" },
    patterns: [/\bavis\b/i],
  },
  {
    provider: { id: "enterprise", name: "Enterprise" },
    patterns: [/\benterprise\s+rent(?:al)?[ -]a[ -]car\b/i],
  },
];

function normalizeForClassification(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countTerms(value: string, terms: readonly string[]): number {
  return terms.reduce(
    (count, term) => count + (value.includes(term) ? 1 : 0),
    0,
  );
}

function confidenceFromScore(score: number): ClassificationConfidence {
  if (score >= 0.8) return "high";
  if (score >= 0.55) return "medium";
  if (score > 0) return "low";
  return "unknown";
}

export function mapRecognitionStatus(
  probableType: ProbableReservationType,
  hasProvider: boolean,
  hasSupportingParser: boolean,
): RecognitionStatus {
  if (probableType === "unknown" || !hasProvider) {
    return "unknown";
  }

  return hasSupportingParser
    ? "recognized-supported"
    : "recognized-unsupported";
}

export function classifyDocument(
  analysis: ClassifiableDocument,
  isProviderSupported: ProviderSupportResolver = () => false,
): DocumentClassification {
  const filename = normalizeForClassification(analysis.document.filename);
  const rawMetadata = [
    analysis.metadata.pdf.title,
    analysis.metadata.pdf.subject,
    analysis.metadata.pdf.author,
    analysis.metadata.pdf.creator,
    analysis.metadata.pdf.producer,
  ]
    .filter(Boolean)
    .join(" ");
  const metadata = normalizeForClassification(rawMetadata);
  const text = normalizeForClassification(analysis.text.sample);
  const scores = TYPE_SIGNALS.map((candidate) => {
    const filenameMatches = countTerms(filename, candidate.terms);
    const metadataMatches = countTerms(metadata, candidate.terms);
    const textMatches = countTerms(text, candidate.terms);

    return {
      type: candidate.type,
      score: filenameMatches * 4 + metadataMatches * 3 + textMatches,
      filenameMatches,
      metadataMatches,
      textMatches,
    };
  }).sort((left, right) => right.score - left.score);

  const strongest = scores[0];
  const runnerUp = scores[1];
  const probableType: ProbableReservationType =
    strongest.score >= 3 && strongest.score > runnerUp.score
      ? strongest.type
      : "unknown";
  const providerEvidence = [
    analysis.document.filename,
    rawMetadata,
    analysis.text.sample,
  ].join(" ");
  const probableProvider =
    PROVIDER_SIGNALS.find((candidate) =>
      candidate.patterns.some((pattern) => pattern.test(providerEvidence)),
    )?.provider ?? null;
  const confidenceScore =
    probableType === "unknown"
      ? 0
      : Math.min(
          0.98,
          0.35 + strongest.score * 0.04 + (probableProvider ? 0.15 : 0),
        );
  const signals = [
    strongest.filenameMatches > 0 ? "filename:reservation-type" : null,
    strongest.metadataMatches > 0 ? "metadata:reservation-type" : null,
    strongest.textMatches > 0 ? "text:reservation-type" : null,
    probableProvider ? "document:provider-name" : null,
  ].filter((signal): signal is string => signal !== null);
  const preliminary = {
    probableType,
    probableProvider,
    confidence: confidenceFromScore(confidenceScore),
    confidenceScore,
    signals,
  };
  const recognitionStatus = mapRecognitionStatus(
    probableType,
    probableProvider !== null,
    isProviderSupported(preliminary),
  );

  return {
    ...preliminary,
    recognitionStatus,
  };
}
