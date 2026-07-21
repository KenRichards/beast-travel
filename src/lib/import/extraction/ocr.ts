import { spawn } from "node:child_process";
import { constants } from "node:fs";
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readdir,
  rm,
} from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

import {
  TEXT_SAMPLE_MAX_CHARACTERS,
  TEXT_SAMPLE_MAX_PAGES,
  type TextExtractionFailure,
} from "../analyzer/types";
import { normalizeTextLines } from "../analyzer/metadata";

export const OCR_RENDER_TIMEOUT_MS = 120_000;
export const OCR_PAGE_TIMEOUT_MS = 45_000;
export const OCR_LANGUAGES = "eng+deu+fra+ita";
export const OCR_RENDER_DPI = 180;
export const OCR_PAGE_SEGMENTATION_MODE = 3;
const MAX_PROCESS_STDERR_BYTES = 16 * 1024;
const MAX_OCR_PAGE_STDOUT_BYTES = 512 * 1024;

export interface ProcessRequest {
  command: string;
  args: string[];
  timeoutMs: number;
  maximumStdoutBytes: number;
  maximumStderrBytes: number;
}

export interface ProcessResult {
  exitCode: number;
  stdout: Uint8Array;
  stderr: string;
}

export type OcrProcessRunner = (
  request: ProcessRequest,
) => Promise<ProcessResult>;

export interface LocalOcrOptions {
  cacheDirectory?: string;
  processRunner?: OcrProcessRunner;
  maximumCharacters?: number;
  maximumPages?: number;
}

export type LocalOcrResult =
  | { status: "success"; text: string; truncated: boolean; pageCount: number }
  | { status: "unavailable"; reason: TextExtractionFailure };

export class OcrProcessError extends Error {
  readonly kind: "tool-unavailable" | "timeout" | "failed";

  constructor(kind: OcrProcessError["kind"]) {
    super(kind);
    this.name = "OcrProcessError";
    this.kind = kind;
  }
}

function appendBounded(
  chunks: Buffer[],
  chunk: Buffer,
  currentSize: number,
  maximumBytes: number,
): number {
  if (currentSize >= maximumBytes) {
    return currentSize;
  }

  const remaining = maximumBytes - currentSize;
  chunks.push(chunk.subarray(0, remaining));
  return currentSize + Math.min(chunk.length, remaining);
}

export const runBoundedProcess: OcrProcessRunner = (request) =>
  new Promise((resolveProcess, rejectProcess) => {
    const child = spawn(request.command, request.args, {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutSize = 0;
    let stderrSize = 0;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, request.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutSize = appendBounded(
        stdoutChunks,
        chunk,
        stdoutSize,
        request.maximumStdoutBytes,
      );
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderrSize = appendBounded(
        stderrChunks,
        chunk,
        stderrSize,
        request.maximumStderrBytes,
      );
    });
    child.once("error", (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      rejectProcess(
        new OcrProcessError(error.code === "ENOENT" ? "tool-unavailable" : "failed"),
      );
    });
    child.once("close", (exitCode) => {
      clearTimeout(timer);

      if (timedOut) {
        rejectProcess(new OcrProcessError("timeout"));
        return;
      }

      resolveProcess({
        exitCode: exitCode ?? -1,
        stdout: Buffer.concat(stdoutChunks),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });
  });

export function isSafeOcrFingerprint(fingerprint: string): boolean {
  return /^[a-f0-9]{64}$/.test(fingerprint);
}

function isWithinDirectory(parent: string, candidate: string): boolean {
  const pathFromParent = relative(parent, candidate);
  return (
    pathFromParent.length > 0 &&
    pathFromParent !== ".." &&
    !pathFromParent.startsWith(`..${sep}`)
  );
}

function toFailure(error: unknown): LocalOcrResult {
  return {
    status: "unavailable",
    reason: error instanceof OcrProcessError ? error.kind : "failed",
  };
}

export async function runLocalOcr(
  contents: Uint8Array,
  fingerprint: string,
  pdfPageCount: number,
  options: LocalOcrOptions = {},
): Promise<LocalOcrResult> {
  if (!isSafeOcrFingerprint(fingerprint)) {
    return { status: "unavailable", reason: "failed" };
  }

  const cacheDirectory = resolve(/* turbopackIgnore: true */
    options.cacheDirectory ??
      resolve(process.cwd(), "travel-data", "cache"),
  );
  const maximumPages = Math.max(
    1,
    Math.min(options.maximumPages ?? TEXT_SAMPLE_MAX_PAGES, TEXT_SAMPLE_MAX_PAGES),
  );
  const maximumCharacters = Math.max(
    1,
    Math.min(
      options.maximumCharacters ?? TEXT_SAMPLE_MAX_CHARACTERS,
      TEXT_SAMPLE_MAX_CHARACTERS,
    ),
  );
  const pageLimit = Math.min(pdfPageCount, maximumPages);
  const processRunner = options.processRunner ?? runBoundedProcess;
  await mkdir(cacheDirectory, { recursive: true, mode: 0o700 });
  const temporaryDirectory = await mkdtemp(
    join(cacheDirectory, `ocr-${fingerprint}-`),
  );

  if (!isWithinDirectory(cacheDirectory, temporaryDirectory)) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    return { status: "unavailable", reason: "failed" };
  }

  try {
    const inputPath = join(temporaryDirectory, "source.pdf");
    const inputHandle = await open(
      inputPath,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o600,
    );

    try {
      await inputHandle.writeFile(contents);
      await inputHandle.sync();
    } finally {
      await inputHandle.close();
    }

    const outputPrefix = join(temporaryDirectory, "page");
    const renderResult = await processRunner({
      command: "pdftoppm",
      args: [
        "-f",
        "1",
        "-l",
        String(pageLimit),
        "-r",
        String(OCR_RENDER_DPI),
        "-png",
        inputPath,
        outputPrefix,
      ],
      timeoutMs: OCR_RENDER_TIMEOUT_MS,
      maximumStdoutBytes: 1,
      maximumStderrBytes: MAX_PROCESS_STDERR_BYTES,
    });

    if (renderResult.exitCode !== 0) {
      return { status: "unavailable", reason: "failed" };
    }

    const pageFiles = (await readdir(temporaryDirectory))
      .filter((filename) => /^page-\d+\.png$/.test(filename))
      .sort((left, right) => {
        const leftPage = Number(left.match(/\d+/)?.[0]);
        const rightPage = Number(right.match(/\d+/)?.[0]);
        return leftPage - rightPage;
      })
      .slice(0, pageLimit);

    if (pageFiles.length === 0) {
      return { status: "unavailable", reason: "failed" };
    }

    const pageText: string[] = [];

    for (const pageFilename of pageFiles) {
      const pagePath = resolve(temporaryDirectory, pageFilename);
      const pageStats = await lstat(pagePath);

      if (!isWithinDirectory(temporaryDirectory, pagePath) || !pageStats.isFile()) {
        return { status: "unavailable", reason: "failed" };
      }

      const ocrResult = await processRunner({
        command: "tesseract",
        args: [
          pagePath,
          "stdout",
          "-l",
          OCR_LANGUAGES,
          "--psm",
          String(OCR_PAGE_SEGMENTATION_MODE),
        ],
        timeoutMs: OCR_PAGE_TIMEOUT_MS,
        maximumStdoutBytes: MAX_OCR_PAGE_STDOUT_BYTES,
        maximumStderrBytes: MAX_PROCESS_STDERR_BYTES,
      });

      if (ocrResult.exitCode !== 0) {
        return { status: "unavailable", reason: "failed" };
      }

      pageText.push(Buffer.from(ocrResult.stdout).toString("utf8"));
    }

    const normalized = normalizeTextLines(pageText.join("\n\n"));
    const truncated = normalized.length > maximumCharacters;
    const text = truncated
      ? normalized.slice(0, maximumCharacters).trimEnd()
      : normalized;

    if (!text) {
      return { status: "unavailable", reason: "failed" };
    }

    return {
      status: "success",
      text,
      truncated,
      pageCount: pageFiles.length,
    };
  } catch (error) {
    return toFailure(error);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
