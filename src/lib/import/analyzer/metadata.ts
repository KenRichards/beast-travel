import type { InfoResult } from "pdf-parse";

import {
  TEXT_SAMPLE_MAX_CHARACTERS,
  TEXT_SAMPLE_MAX_PAGES,
  type ExtractedTextSample,
  type PdfDocumentMetadata,
} from "./types";
import type { ExtractionMethod } from "../reservation";

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

export function normalizeTextLines(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1]))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasAdequateNativeText(value: string): boolean {
  const normalized = normalizeText(value);
  const lettersAndNumbers = normalized.match(/[\p{L}\p{N}]/gu)?.length ?? 0;

  return normalized.length >= 120 && lettersAndNumbers >= 80;
}

export function createTextSample(
  text: string,
  maximumCharacters = TEXT_SAMPLE_MAX_CHARACTERS,
  method: ExtractionMethod = "native-text",
): ExtractedTextSample {
  const normalized = normalizeTextLines(text);
  const truncated = normalized.length > maximumCharacters;
  const sample = truncated
    ? normalized.slice(0, maximumCharacters).trimEnd()
    : normalized;

  return {
    status: sample ? "extracted" : "image-only",
    method: sample ? method : "unavailable",
    sample,
    characterCount: sample.length,
    truncated,
    pageLimit: TEXT_SAMPLE_MAX_PAGES,
  };
}
