import "server-only";

import { endNfcSessionAction } from "@/lib/actions/nfc-auth";
import {
  cardEntryPathForUniqueId,
  nfcLoginPathForUniqueId,
} from "@/lib/nfc/card-paths";
import { nfcCardValidationErrorMessage } from "@/lib/nfc/card-validation-messages";
import {
  ACCOUNT_SUSPENDED_MESSAGE,
  NFC_CARD_INACTIVE_MESSAGE,
  NFC_CARD_PIN_REQUIRED_MESSAGE,
  NFC_SESSION_COOKIE,
  NFC_SUSPENDED_PATH,
} from "@/lib/nfc/constants";
import { logNfcDebug } from "@/lib/nfc/nfc-debug.server";
import { resolveSmartNfcEntryRedirect } from "@/lib/nfc/nfc-smart-entry.server";
import {
  loadNfcSessionRow,
  resolveNfcSlugByCardUuid,
} from "@/lib/nfc/nfc-session-activity.server";
import { validateNfcCardActive } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";

export type NfcScanAccessDeniedReason =
  | "no_session"
  | "session_mismatch"
  | "persistence_expired"
  | "invalid_format"
  | "card_not_found"
  | "inactive"
  | "db_error"
  | "account_suspended";

export type NfcScanAccessResult =
  | { ok: true; redirectTo: string }
  | {
      ok: false;
      pinEntryPath: string;
      reason: NfcScanAccessDeniedReason;
      message: string;
    };

function pinEntryFor(uniqueId: string): string {
  return nfcLoginPathForUniqueId(uniqueId);
}

async function clearSessionIfCardMismatch(
  scannedUniqueId: string
): Promise<"match" | "mismatch" | "no_session"> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(NFC_SESSION_COOKIE)?.value?.trim() ?? "";

  if (!sessionId) {
    return "no_session";
  }

  const admin = createServiceRoleClient();
  const session = await loadNfcSessionRow(admin, sessionId);

  if (!session?.nfc_id) {
    return "no_session";
  }

  const sessionSlug = await resolveNfcSlugByCardUuid(admin, session.nfc_id);

  if (!sessionSlug || sessionSlug !== scannedUniqueId) {
    logNfcDebug("resolveNfcScanAccess:session-mismatch", {
      scannedUniqueId,
      sessionSlug,
    });
    await endNfcSessionAction();
    return "mismatch";
  }

  return "match";
}

/**
 * NFC okuma — yalnızca oturumdaki kart slug'ı okunan kart ile aynıysa
 * (24s smart entry) otomatik geçiş. Aksi halde PIN zorunlu; veri sızdırılmaz.
 */
export async function resolveNfcScanAccess(
  rawUniqueId: string,
  options?: {
    clientLastLoginMs?: number | null;
    searchParams?: Record<string, string | string[] | undefined>;
  }
): Promise<NfcScanAccessResult> {
  const uniqueId = normalizeNfcUniqueId(rawUniqueId);

  logNfcDebug("resolveNfcScanAccess:start", { uniqueId, options: options ?? null });

  if (!uniqueId.startsWith("at_")) {
    return {
      ok: false,
      pinEntryPath: cardEntryPathForUniqueId(uniqueId || rawUniqueId),
      reason: "invalid_format",
      message: "Geçersiz NFC kart kodu.",
    };
  }

  const card = await validateNfcCardActive(uniqueId);
  if (!card.ok) {
    const reason =
      card.reason === "inactive"
        ? "inactive"
        : card.reason === "not_found"
          ? "card_not_found"
          : "db_error";

    return {
      ok: false,
      pinEntryPath: pinEntryFor(uniqueId),
      reason,
      message:
        card.reason === "inactive"
          ? NFC_CARD_INACTIVE_MESSAGE
          : nfcCardValidationErrorMessage(
              card.reason === "db_error" ? "db_error" : "not_found"
            ),
    };
  }

  const sessionMatch = await clearSessionIfCardMismatch(uniqueId);

  if (sessionMatch === "mismatch") {
    return {
      ok: false,
      pinEntryPath: pinEntryFor(uniqueId),
      reason: "session_mismatch",
      message: NFC_CARD_PIN_REQUIRED_MESSAGE,
    };
  }

  const smartRedirect = await resolveSmartNfcEntryRedirect(uniqueId, options);

  if (smartRedirect) {
    if (smartRedirect.startsWith(NFC_SUSPENDED_PATH)) {
      return {
        ok: false,
        pinEntryPath: smartRedirect,
        reason: "account_suspended",
        message: ACCOUNT_SUSPENDED_MESSAGE,
      };
    }

    logNfcDebug("resolveNfcScanAccess:granted", { uniqueId, redirectTo: smartRedirect });
    return { ok: true, redirectTo: smartRedirect };
  }

  const reason: NfcScanAccessDeniedReason =
    sessionMatch === "match" ? "persistence_expired" : "no_session";

  return {
    ok: false,
    pinEntryPath: pinEntryFor(uniqueId),
    reason,
    message: NFC_CARD_PIN_REQUIRED_MESSAGE,
  };
}
