import "server-only";

import { nfcAuthSuccessAction } from "@/lib/actions/nfc-auth-success";
import {
  cardEntryPathForUniqueId,
  publicProfilePathForUniqueId,
} from "@/lib/nfc/card-paths";
import { assertAccountLoginAllowed } from "@/lib/nfc/account-status.server";
import { DASHBOARD_PATH, NFC_SUSPENDED_PATH, STORAGE_VERIFIED_COOKIE } from "@/lib/nfc/constants";
import { clearPendingNfcCardCookie, getStrictCookieOptions } from "@/lib/nfc/device-cookies.server";
import { logNfcDebug } from "@/lib/nfc/nfc-debug.server";
import { assertNfcUserDataCardForSession } from "@/lib/nfc/nfc-user-data-card.server";
import { resolveSmartNfcEntryRedirect } from "@/lib/nfc/nfc-smart-entry.server";
import { isSafePostAuthReturnPath } from "@/lib/nfc/post-pin-redirect.server";
import { setNfcSession, validateNfcCardActive } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";

export type EstablishNfcTapSessionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; reason: string; fallbackTo: string };

async function confirmStorageAccessCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STORAGE_VERIFIED_COOKIE, "1", getStrictCookieOptions());
}

/**
 * Fiziksel NFC dokunuşu — PIN olmadan kart sahibi oturumu açar.
 * Mevcut geçerli oturum varsa yeniden oluşturmaz.
 */
export async function establishNfcTapSession(
  rawUniqueId: string,
  options?: { returnTo?: string }
): Promise<EstablishNfcTapSessionResult> {
  const uniqueId = normalizeNfcUniqueId(rawUniqueId);

  logNfcDebug("establishNfcTapSession:start", { uniqueId, returnTo: options?.returnTo });

  if (!uniqueId.startsWith("at_")) {
    return {
      ok: false,
      reason: "invalid_format",
      fallbackTo: publicProfilePathForUniqueId(uniqueId || rawUniqueId),
    };
  }

  const smartRedirect = await resolveSmartNfcEntryRedirect(uniqueId);
  if (smartRedirect) {
    const redirectTo =
      options?.returnTo && isSafePostAuthReturnPath(options.returnTo)
        ? options.returnTo
        : smartRedirect;
    logNfcDebug("establishNfcTapSession:existing-session", { uniqueId, redirectTo });
    return { ok: true, redirectTo };
  }

  const card = await validateNfcCardActive(uniqueId);
  if (!card.ok) {
    return {
      ok: false,
      reason: card.reason,
      fallbackTo: publicProfilePathForUniqueId(uniqueId),
    };
  }

  if (!card.profileId) {
    return {
      ok: false,
      reason: "no_profile",
      fallbackTo: cardEntryPathForUniqueId(uniqueId),
    };
  }

  const admin = createServiceRoleClient();
  const cardAssert = await assertNfcUserDataCardForSession(admin, {
    uniqueId,
    nfcCardUuid: card.nfcId,
  });

  if (!cardAssert.ok) {
    return {
      ok: false,
      reason: "invalid_card",
      fallbackTo: publicProfilePathForUniqueId(uniqueId),
    };
  }

  try {
    await assertAccountLoginAllowed({
      profileId: card.profileId,
      uniqueId,
      nfcCardUuid: card.nfcId,
    });
  } catch {
    return {
      ok: false,
      reason: "account_suspended",
      fallbackTo: `${NFC_SUSPENDED_PATH}?uid=${encodeURIComponent(uniqueId)}`,
    };
  }

  try {
    await setNfcSession({
      profileId: card.profileId,
      nfcCardUuid: card.nfcId,
    });
    await confirmStorageAccessCookie();
    await clearPendingNfcCardCookie();
    await nfcAuthSuccessAction(uniqueId);
  } catch (error) {
    console.error("[establishNfcTapSession]", error);
    return {
      ok: false,
      reason: "session_error",
      fallbackTo: cardEntryPathForUniqueId(uniqueId),
    };
  }

  const redirectTo =
    options?.returnTo && isSafePostAuthReturnPath(options.returnTo)
      ? options.returnTo
      : DASHBOARD_PATH;

  logNfcDebug("establishNfcTapSession:created", { uniqueId, redirectTo, profileId: card.profileId });

  return { ok: true, redirectTo };
}
