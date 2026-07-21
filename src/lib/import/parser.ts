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
    document: ImportDocument,
    classification: DocumentClassification,
  ): Promise<NormalizedReservation>;
}

export interface ReservationImportResult {
  document: ImportDocument;
  classification: DocumentClassification;
  parser: {
    id: string;
    displayName: string;
  };
  reservation: NormalizedReservation;
}

export class ReservationParserNotFoundError extends Error {
  constructor(document: ImportDocument) {
    super(`No reservation parser is registered for ${document.filename}.`);
    this.name = "ReservationParserNotFoundError";
  }
}

export function createReservationParser(
  parsers: readonly ReservationProviderParser[],
) {
  return async function parseReservation(
    document: ImportDocument,
  ): Promise<ReservationImportResult> {
    const classification = classifyDocument(document);
    const parser = parsers.find((candidate) =>
      candidate.canParse(classification, document),
    );

    if (!parser) {
      throw new ReservationParserNotFoundError(document);
    }

    const reservation = await parser.parse(document, classification);

    return {
      document,
      classification,
      parser: {
        id: parser.id,
        displayName: parser.displayName,
      },
      reservation,
    };
  };
}

export const parseReservationDocument = createReservationParser(providerParsers);
