import {
  analyzeIncomingDocument,
  toPublicDocumentAnalysis,
} from "./analyzer/analyzer";
import type {
  AnalyzedDocument,
  PublicDocumentAnalysis,
} from "./analyzer/types";
import { classifyDocument, type DocumentClassification } from "./classifier";
import { providerParsers } from "./providers";
import type { NormalizedReservation } from "./reservation";

export interface ImportDocument {
  filename: string;
  size: number;
  lastModified: string;
  extension: string;
}

export interface ReservationProviderParser {
  id: string;
  displayName: string;
  canParse(
    classification: DocumentClassification,
    document: ImportDocument,
  ): boolean;
  parse(
    analysis: AnalyzedDocument,
    classification: DocumentClassification,
  ): Promise<NormalizedReservation>;
}

interface ReservationImportBase {
  document: ImportDocument;
  analysis: PublicDocumentAnalysis;
  classification: DocumentClassification;
}

export interface ParsedReservationImportResult extends ReservationImportBase {
  status: "parsed";
  parser: {
    id: string;
    displayName: string;
  };
  reservation: NormalizedReservation;
}

export interface UnparsedReservationImportResult extends ReservationImportBase {
  status: "unsupported" | "unknown";
  message: string;
}

export type ReservationImportResult =
  | ParsedReservationImportResult
  | UnparsedReservationImportResult;

export function createReservationParser(
  parsers: readonly ReservationProviderParser[],
) {
  return async function parseReservation(
    filename: string,
  ): Promise<ReservationImportResult> {
    const analyzedDocument = await analyzeIncomingDocument(filename);
    const classification = classifyDocument(analyzedDocument, (candidate) =>
      parsers.some((parser) =>
        parser.canParse(
          { ...candidate, recognitionStatus: "recognized-supported" },
          analyzedDocument.document,
        ),
      ),
    );
    const baseResult: ReservationImportBase = {
      document: analyzedDocument.document,
      analysis: toPublicDocumentAnalysis(analyzedDocument),
      classification,
    };

    if (classification.recognitionStatus === "recognized-unsupported") {
      return {
        ...baseResult,
        status: "unsupported",
        message: `${classification.probableProvider?.name ?? "This provider"} reservations are recognized, but a parser is not supported yet.`,
      };
    }

    if (classification.recognitionStatus === "unknown") {
      return {
        ...baseResult,
        status: "unknown",
        message:
          classification.probableType === "unknown"
            ? "This PDF could not be identified as a supported reservation type."
            : "The reservation type was identified, but the provider could not be recognized.",
      };
    }

    const parser = parsers.find((candidate) =>
      candidate.canParse(classification, analyzedDocument.document),
    );

    if (!parser) {
      return {
        ...baseResult,
        status: "unsupported",
        message:
          "This reservation is recognized, but a matching parser is not available.",
      };
    }

    const reservation = await parser.parse(
      analyzedDocument,
      classification,
    );

    return {
      ...baseResult,
      status: "parsed",
      parser: {
        id: parser.id,
        displayName: parser.displayName,
      },
      reservation,
    };
  };
}

export const parseReservationDocument = createReservationParser(providerParsers);
