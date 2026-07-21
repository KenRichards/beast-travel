import type { ImportDocument } from "../parser";

export const TEXT_SAMPLE_MAX_CHARACTERS = 12_000;
export const TEXT_SAMPLE_MAX_PAGES = 10;
export const MAX_PDF_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export type TextExtractionStatus = "extracted" | "image-only";

export interface PdfDocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pageCount: number;
  pdfVersion?: string;
}

export interface DocumentMetadata {
  filename: string;
  extension: string;
  mimeType: "application/pdf";
  fileSize: number;
  filesystemModifiedAt: string;
  sha256: string;
  pdf: PdfDocumentMetadata;
}

export interface ExtractedTextSample {
  status: TextExtractionStatus;
  sample: string;
  characterCount: number;
  truncated: boolean;
  pageLimit: number;
}

export interface AnalyzedDocument {
  document: ImportDocument;
  metadata: DocumentMetadata;
  text: ExtractedTextSample;
}

export interface PublicDocumentAnalysis {
  metadata: DocumentMetadata;
  textExtraction: Omit<ExtractedTextSample, "sample">;
}

export type DocumentAnalysisErrorCode =
  | "invalid-path"
  | "not-found"
  | "not-pdf"
  | "too-large"
  | "malformed-pdf"
  | "encrypted-pdf"
  | "unreadable";

const ERROR_MESSAGES: Record<DocumentAnalysisErrorCode, string> = {
  "invalid-path": "The selected document name is not valid.",
  "not-found": "This document is no longer available in the Travel Inbox.",
  "not-pdf": "Only valid PDF documents can be analyzed.",
  "too-large": "This PDF is too large to analyze safely.",
  "malformed-pdf": "This PDF is damaged or could not be read.",
  "encrypted-pdf": "Encrypted or password-protected PDFs are not supported.",
  unreadable: "This document could not be read safely.",
};

export class DocumentAnalysisError extends Error {
  readonly code: DocumentAnalysisErrorCode;

  constructor(code: DocumentAnalysisErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "DocumentAnalysisError";
    this.code = code;
  }
}
