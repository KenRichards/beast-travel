import { createHash } from "node:crypto";

export function createSha256Fingerprint(contents: Uint8Array): string {
  return createHash("sha256").update(contents).digest("hex");
}
