import "server-only";

import { nfcLoginPathForUniqueId } from "@/lib/nfc/card-paths";
import { isSafePostAuthReturnPath } from "@/lib/nfc/post-pin-redirect.server";
import { resolveNfcScanAccess } from "@/lib/nfc/nfc-scan-access.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { logNfcDebug } from "@/lib/nfc/nfc-debug.server";

export type EstablishNfcTapSessionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; reason: string; fallbackTo: string };

/**
 * NFC dokunuşu — PIN'siz oturum oluşturmaz.
 * Yalnızca mevcut oturum okunan kartın sahibiyle eşleşiyorsa dashboard'a geçer.
 */
export async function establishNfcTapSession(
  rawUniqueId: string,
  options?: { returnTo?: string }
): Promise<EstablishNfcTapSessionResult> {
  const uniqueId = normalizeNfcUniqueId(rawUniqueId);

  logNfcDebug("establishNfcTapSession:start", { uniqueId, returnTo: options?.returnTo });

  const access = await resolveNfcScanAccess(uniqueId);

  if (access.ok) {
    const redirectTo =
      options?.returnTo && isSafePostAuthReturnPath(options.returnTo)
        ? options.returnTo
        : access.redirectTo;

    return { ok: true, redirectTo };
  }

  const fallbackTo =
    access.reason === "account_suspended"
      ? access.pinEntryPath
      : nfcLoginPathForUniqueId(uniqueId);

  return {
    ok: false,
    reason: access.reason,
    fallbackTo,
  };
}
