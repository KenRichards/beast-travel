import { constants } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  unlink,
} from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import type {
  ApprovedReservation,
  NormalizedReservation,
} from "../reservation";
import { parseApprovedReservation } from "../validation/schema";
import { validateReservation } from "../validation/reservation";

export const reservationsDirectory = resolve(
  process.cwd(),
  "travel-data",
  "reservations",
);

export class ReservationPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationPersistenceError";
  }
}

export interface ReservationLoadResult {
  reservations: ApprovedReservation[];
  malformedFiles: string[];
}

export function reservationFilename(fingerprint: string): string {
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
    throw new ReservationPersistenceError("The document fingerprint is invalid.");
  }
  return `reservation-${fingerprint.slice(0, 24)}.json`;
}

function reservationPath(fingerprint: string, directory = reservationsDirectory): string {
  return join(directory, reservationFilename(fingerprint));
}

async function readReservationFile(
  path: string,
): Promise<ApprovedReservation | null> {
  try {
    const stats = await lstat(path);
    if (!stats.isFile() || stats.isSymbolicLink()) return null;
    const value: unknown = JSON.parse(await readFile(path, "utf8"));
    return parseApprovedReservation(value) as ApprovedReservation | null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    return null;
  }
}

export async function loadApprovedReservations(
  directory = reservationsDirectory,
): Promise<ReservationLoadResult> {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const entries = await readdir(directory, { withFileTypes: true });
  const reservations: ApprovedReservation[] = [];
  const malformedFiles: string[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !/^reservation-[a-f0-9]{24}\.json$/.test(entry.name)) {
      continue;
    }
    const reservation = await readReservationFile(join(directory, entry.name));
    if (reservation) reservations.push(reservation);
    else malformedFiles.push(entry.name);
  }

  reservations.sort((left, right) =>
    right.modifiedAt.localeCompare(left.modifiedAt),
  );
  return { reservations, malformedFiles };
}

export async function loadReservationByFingerprint(
  fingerprint: string,
  directory = reservationsDirectory,
): Promise<ApprovedReservation | null> {
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) return null;
  return readReservationFile(reservationPath(fingerprint, directory));
}

export async function loadReservationById(
  id: string,
  directory = reservationsDirectory,
): Promise<ApprovedReservation | null> {
  if (!/^reservation-[a-f0-9]{24}$/.test(id)) return null;
  const loaded = await loadApprovedReservations(directory);
  return loaded.reservations.find((reservation) => reservation.id === id) ?? null;
}

async function acquireLock(lockPath: string): Promise<() => Promise<void>> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const handle = await open(
        lockPath,
        constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
        0o600,
      );
      await handle.close();
      return async () => {
        try {
          await unlink(lockPath);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await new Promise((resolveWait) => setTimeout(resolveWait, 25));
    }
  }

  throw new ReservationPersistenceError(
    "This reservation is already being approved. Try again shortly.",
  );
}

export async function approveReservation(
  reservation: NormalizedReservation,
  now = new Date(),
  directory = reservationsDirectory,
): Promise<{ reservation: ApprovedReservation; updated: boolean }> {
  const validation = validateReservation(reservation);
  if (!validation.valid) {
    throw new ReservationPersistenceError(
      "The reservation contains validation errors.",
    );
  }

  await mkdir(directory, { recursive: true, mode: 0o700 });
  const finalPath = reservationPath(reservation.documentFingerprint, directory);
  const lockPath = `${finalPath}.lock`;
  const releaseLock = await acquireLock(lockPath);
  let temporaryPath: string | null = null;

  try {
    const existing = await readReservationFile(finalPath);
    if (!existing) {
      try {
        const stats = await lstat(finalPath);
        if (stats.isFile()) {
          throw new ReservationPersistenceError(
            "The existing reservation record is malformed and was not overwritten.",
          );
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    const timestamp = now.toISOString();
    const approved = {
      ...reservation,
      status: "approved" as const,
      importedAt: existing?.importedAt ?? reservation.importedAt,
      createdAt: existing?.createdAt ?? timestamp,
      modifiedAt: timestamp,
      approvedAt: timestamp,
    } as ApprovedReservation;
    temporaryPath = join(
      directory,
      `.${basename(finalPath)}.${process.pid}.${randomUUID()}.tmp`,
    );
    const handle = await open(
      temporaryPath,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o600,
    );

    try {
      await handle.writeFile(`${JSON.stringify(approved, null, 2)}\n`, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }

    await rename(temporaryPath, finalPath);
    temporaryPath = null;
    return { reservation: approved, updated: existing !== null };
  } catch (error) {
    if (error instanceof ReservationPersistenceError) throw error;
    throw new ReservationPersistenceError(
      "The reservation could not be saved safely.",
    );
  } finally {
    if (temporaryPath) {
      try {
        await unlink(temporaryPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          // Cleanup failure is intentionally not exposed with path details.
        }
      }
    }
    await releaseLock();
  }
}
