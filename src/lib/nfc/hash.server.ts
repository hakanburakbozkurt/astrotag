import "server-only";

import { createHash } from "crypto";

export function hashNfcPayload(rawPayload: string): string {
  const normalized = rawPayload.trim();
  if (!normalized) {
    throw new Error("NFC payload boş");
  }

  return createHash("sha256").update(normalized, "utf8").digest("hex");
}
