import "server-only";

import { constants } from "node:fs";
import { open } from "node:fs/promises";

import {
  FormatError,
  InvalidPDFException,
  PasswordException,
  PDFParse,
} from "pdf-parse";

import {
  getIncomingDocument,
  resolveIncomingDocumentPath,
} from "../documents";
import { createSha256Fingerprint } from "./fingerprint";
import { createTextSample, extractPdfMetadata } from "./metadata";
import {
  DocumentAnalysisError,
  MAX_PDF_FILE_SIZE_BYTES,
  TEXT_SAMPLE_MAX_PAGES,
  type AnalyzedDocument,
  type PublicDocumentAnalysis,
} from "./types";

const PDF_SIGNATURE = "%PDF-";

function isPdf(contents: Uint8Array): boolean {
  return Buffer.from(contents.subarray(0, PDF_SIGNATURE.length)).toString(
    "ascii",
  ) === PDF_SIGNATURE;
}

function mapPdfError(error: unknown): DocumentAnalysisError {
  if (error instanceof PasswordException) {
    return new DocumentAnalysisError("encrypted-pdf");
  }

  if (error instanceof InvalidPDFException || error instanceof FormatError) {
    return new DocumentAnalysisError("malformed-pdf");
  }

  return new DocumentAnalysisError("unreadable");
}

export function toPublicDocumentAnalysis(
  analysis: AnalyzedDocument,
): PublicDocumentAnalysis {
  return {
    metadata: analysis.metadata,
    textExtraction: {
      status: analysis.text.status,
      characterCount: analysis.text.characterCount,
      truncated: analysis.text.truncated,
      pageLimit: analysis.text.pageLimit,
    },
  };
}

export async function analyzeIncomingDocument(
  filename: string,
): Promise<AnalyzedDocument> {
  const documentPath = resolveIncomingDocumentPath(filename);

  if (!documentPath) {
    throw new DocumentAnalysisError("invalid-path");
  }

  const discoveredDocument = await getIncomingDocument(filename);

  if (!discoveredDocument) {
    throw new DocumentAnalysisError("not-found");
  }

  if (discoveredDocument.extension.toLowerCase() !== ".pdf") {
    throw new DocumentAnalysisError("not-pdf");
  }

  let fileHandle;

  try {
    fileHandle = await open(
      documentPath,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    );
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT" || code === "ENOTDIR") {
      throw new DocumentAnalysisError("not-found");
    }

    throw new DocumentAnalysisError("unreadable");
  }

  let contents: Uint8Array;
  let stats;

  try {
    stats = await fileHandle.stat();

    if (!stats.isFile()) {
      throw new DocumentAnalysisError("not-found");
    }

    if (stats.size > MAX_PDF_FILE_SIZE_BYTES) {
      throw new DocumentAnalysisError("too-large");
    }

    contents = Uint8Array.from(await fileHandle.readFile());
  } finally {
    await fileHandle.close();
  }

  if (!isPdf(contents)) {
    throw new DocumentAnalysisError("not-pdf");
  }

  const sha256 = createSha256Fingerprint(contents);
  const parser = new PDFParse({ data: contents });

  try {
    const pdfInfo = await parser.getInfo();
    const extractedText = await parser.getText({
      first: TEXT_SAMPLE_MAX_PAGES,
    });
    const text = createTextSample(extractedText.text);

    return {
      document: {
        filename,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        extension: discoveredDocument.extension,
      },
      metadata: {
        filename,
        extension: discoveredDocument.extension.toLowerCase(),
        mimeType: "application/pdf",
        fileSize: stats.size,
        filesystemModifiedAt: stats.mtime.toISOString(),
        sha256,
        pdf: extractPdfMetadata(pdfInfo),
      },
      text,
    };
  } catch (error) {
    throw mapPdfError(error);
  } finally {
    await parser.destroy();
  }
}
