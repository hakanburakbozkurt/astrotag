"use server";

import { revalidateTag } from "next/cache";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

/** NFC başarıyla doğrulandıktan sonra — render dışında cache invalidation. */
export async function nfcAuthSuccessAction(uniqueId: string): Promise<void> {
  const normalizedId = normalizeNfcUniqueId(uniqueId);

  if (!normalizedId) {
    return;
  }

  revalidateTag(`nfc-card-auth:${normalizedId}`, "max");

  logNfcEvent(
    "info",
    { layer: "action", handler: "nfcAuthSuccessAction" },
    "NFC doğrulama sonrası kart auth cache invalidation",
    { uniqueId: normalizedId }
  );
}
