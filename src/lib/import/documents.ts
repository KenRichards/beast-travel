import { lstat, readdir } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

import type { ImportDocument } from "./parser";

const incomingDirectory = resolve(process.cwd(), "travel-data", "incoming");

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
  if (!filename || basename(filename) !== filename || filename.startsWith(".")) {
    return null;
  }

  try {
    const file = await lstat(resolve(incomingDirectory, filename));

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
