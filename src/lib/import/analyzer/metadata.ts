import type { InfoResult } from "pdf-parse";

import {
  TEXT_SAMPLE_MAX_CHARACTERS,
  TEXT_SAMPLE_MAX_PAGES,
  type ExtractedTextSample,
  type PdfDocumentMetadata,
} from "./types";

type PdfInfoDictionary = Record<string, unknown>;

function cleanMetadataValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || undefined;
}

function toIsoDate(value: Date | null | undefined): string | undefined {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return undefined;
  }

  return value.toISOString();
}

export function extractPdfMetadata(result: InfoResult): PdfDocumentMetadata {
  const info = (result.info ?? {}) as PdfInfoDictionary;
  const dates = result.getDateNode();

  return {
    title: cleanMetadataValue(info.Title),
    author: cleanMetadataValue(info.Author),
    subject: cleanMetadataValue(info.Subject),
    creator: cleanMetadataValue(info.Creator),
    producer: cleanMetadataValue(info.Producer),
    creationDate: toIsoDate(dates.CreationDate),
    modificationDate: toIsoDate(dates.ModDate),
    pageCount: result.total,
    pdfVersion: cleanMetadataValue(info.PDFFormatVersion),
  };
}

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function createTextSample(
  text: string,
  maximumCharacters = TEXT_SAMPLE_MAX_CHARACTERS,
): ExtractedTextSample {
  const normalized = normalizeText(text);
  const truncated = normalized.length > maximumCharacters;
  const sample = truncated
    ? normalized.slice(0, maximumCharacters).trimEnd()
    : normalized;

  return {
    status: sample ? "extracted" : "image-only",
    sample,
    characterCount: sample.length,
    truncated,
    pageLimit: TEXT_SAMPLE_MAX_PAGES,
  };
}
