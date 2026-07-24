import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isAccountLoginAllowed } from "@/lib/nfc/account-status.server";
import {
  DASHBOARD_PATH,
  NFC_CARD_COOKIE,
  NFC_PROFILE_COOKIE,
  NFC_PROFILE_READY_COOKIE,
  NFC_SESSION_COOKIE,
  NFC_SESSION_EXPIRES_COOKIE,
} from "@/lib/nfc/constants";
import { readCookieSessionSnapshot } from "@/lib/nfc/cookie-session.shared";
import { logNfcDebug } from "@/lib/nfc/nfc-debug.server";
import { readLastLoginAtCookie } from "@/lib/nfc/auth-persistence.server";
import {
  isNfcSessionTwentyFourHourPolicyValid,
  isPersistenceAnchorValid,
} from "@/lib/nfc/nfc-session-persistence.server";
import {
  loadNfcSessionRow,
  resolveNfcSlugByCardUuid,
  touchNfcSessionActivity,
} from "@/lib/nfc/nfc-session-activity.server";
import { readPostAuthReturnToCookie } from "@/lib/nfc/post-pin-redirect.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { cookies } from "next/headers";

export type SmartNfcSessionEntryResult =
  | { ok: true; redirectTo: string }
  | { ok: false; reason: string };

/**
 * Geçerli oturum + aynı kart + 24 saat persistence → PIN bypass.
 * Hedef: post-auth çerezi veya /dashboard.
 */
export async function trySmartNfcSessionEntry(
  supabase: SupabaseClient,
  scannedUniqueId: string,
  sessionId: string,
  options?: { clientLastLoginMs?: number | null }
): Promise<SmartNfcSessionEntryResult> {
  const normalizedScan = normalizeNfcUniqueId(scannedUniqueId);
  const trimmedSessionId = sessionId.trim();

  logNfcDebug("trySmartNfcSessionEntry:start", {
    scannedUniqueId: normalizedScan,
    sessionIdPresent: Boolean(trimmedSessionId),
    sessionIdPrefix: trimmedSessionId ? `${trimmedSessionId.slice(0, 8)}…` : null,
    clientLastLoginMs: options?.clientLastLoginMs ?? null,
  });

  if (!normalizedScan || !trimmedSessionId) {
    return {
      ok: false,
      reason: !normalizedScan ? "missing_nfc_id" : "missing_session_token",
    };
  }

  const cookieLastLogin = await readLastLoginAtCookie();
  const persistenceValid = isPersistenceAnchorValid(
    cookieLastLogin,
    options?.clientLastLoginMs ?? null
  );

  logNfcDebug("trySmartNfcSessionEntry:persistence", {
    cookieLastLogin,
    persistenceValid,
  });

  if (!persistenceValid) {
    return { ok: false, reason: "persistence_expired" };
  }

  const session = await loadNfcSessionRow(supabase, trimmedSessionId);

  logNfcDebug("trySmartNfcSessionEntry:session", {
    sessionFound: Boolean(session),
    profileId: session?.profile_id ?? null,
    nfcCardUuid: session?.nfc_id ?? null,
    expiresAt: session?.expires_at ?? null,
    lastActiveAt: session?.last_active_at ?? null,
  });

  if (!session?.profile_id) {
    return { ok: false, reason: "session_row_missing" };
  }

  if (!isNfcSessionTwentyFourHourPolicyValid(session)) {
    return { ok: false, reason: "session_policy_invalid" };
  }

  const sessionSlug = await resolveNfcSlugByCardUuid(supabase, session.nfc_id);

  logNfcDebug("trySmartNfcSessionEntry:card-match", {
    sessionSlug,
    normalizedScan,
    matches: sessionSlug === normalizedScan,
  });

  if (!sessionSlug || sessionSlug !== normalizedScan) {
    return { ok: false, reason: "card_slug_mismatch" };
  }

  const cookieStore = await cookies();
  const cookieSnapshot = readCookieSessionSnapshot(cookieStore, {
    session: NFC_SESSION_COOKIE,
    profile: NFC_PROFILE_COOKIE,
    card: NFC_CARD_COOKIE,
    expires: NFC_SESSION_EXPIRES_COOKIE,
    profileReady: NFC_PROFILE_READY_COOKIE,
  });

  if (
    !cookieSnapshot ||
    cookieSnapshot.sessionId !== trimmedSessionId ||
    cookieSnapshot.profileId !== session.profile_id
  ) {
    logNfcDebug("trySmartNfcSessionEntry:cookie-bundle-invalid", {
      hasSnapshot: Boolean(cookieSnapshot),
      sessionIdMatch: cookieSnapshot?.sessionId === trimmedSessionId,
    });
    return { ok: false, reason: "cookie_bundle_invalid" };
  }

  const loginAllowed = await isAccountLoginAllowed({
    profileId: session.profile_id,
    uniqueId: normalizedScan,
    nfcCardUuid: session.nfc_id,
  });

  if (!loginAllowed) {
    return { ok: false, reason: "account_suspended" };
  }

  await touchNfcSessionActivity(supabase, session.id);

  const savedReturnTo = await readPostAuthReturnToCookie();
  const redirectTo = savedReturnTo ?? DASHBOARD_PATH;

  logNfcDebug("trySmartNfcSessionEntry:success", {
    redirectTo,
    usedSavedReturnTo: Boolean(savedReturnTo),
  });

  return { ok: true, redirectTo };
}
