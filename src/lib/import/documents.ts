import { lstat, readdir } from "node:fs/promises";
import { basename, extname, relative, resolve, sep } from "node:path";

import type { ImportDocument } from "./parser";

export const incomingDirectory = resolve(
  process.cwd(),
  "travel-data",
  "incoming",
);

export function isSafeIncomingFilename(filename: string): boolean {
  if (
    !filename ||
    filename.includes("\0") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    basename(filename) !== filename ||
    filename.startsWith(".")
  ) {
    return false;
  }

  const candidate = resolve(incomingDirectory, filename);
  const pathFromIncoming = relative(incomingDirectory, candidate);

  return (
    pathFromIncoming.length > 0 &&
    pathFromIncoming !== ".." &&
    !pathFromIncoming.startsWith(`..${sep}`)
  );
}

export function resolveIncomingDocumentPath(filename: string): string | null {
  return isSafeIncomingFilename(filename)
    ? resolve(incomingDirectory, filename)
    : null;
}

function toImportDocument(
  filename: string,
  size: number,
  lastModified: Date,
): ImportDocument {
  return {
    filename,
    size,
    lastModified: lastModified.toISOString(),
    extension: extname(filename),
  };
}

export async function listIncomingDocuments(): Promise<ImportDocument[]> {
  const entries = await readdir(incomingDirectory, { withFileTypes: true });
  const documents = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
      .map(async (entry) => {
        const file = await lstat(resolve(incomingDirectory, entry.name));
        return toImportDocument(entry.name, file.size, file.mtime);
      }),
  );

  return documents.sort(
    (left, right) =>
      Date.parse(right.lastModified) - Date.parse(left.lastModified) ||
      left.filename.localeCompare(right.filename),
  );
}

export async function getIncomingDocument(
  filename: string,
): Promise<ImportDocument | null> {
  const documentPath = resolveIncomingDocumentPath(filename);

  if (!documentPath) {
    return null;
  }

  try {
    const file = await lstat(documentPath);

    if (!file.isFile()) {
      return null;
    }

    return toImportDocument(filename, file.size, file.mtime);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return null;
    }

    throw error;
  }
}
