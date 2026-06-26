import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { DASHBOARD_PATH } from "@/lib/nfc/constants";
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
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

/**
 * Geçerli oturum + aynı kart + 24 saat persistence → PIN bypass → /dashboard.
 */
export async function trySmartNfcSessionEntry(
  supabase: SupabaseClient,
  scannedUniqueId: string,
  sessionId: string,
  options?: { clientLastLoginMs?: number | null }
): Promise<string | null> {
  const normalizedScan = normalizeNfcUniqueId(scannedUniqueId);
  if (!normalizedScan || !sessionId.trim()) {
    return null;
  }

  const cookieLastLogin = await readLastLoginAtCookie();
  if (
    !isPersistenceAnchorValid(cookieLastLogin, options?.clientLastLoginMs ?? null)
  ) {
    return null;
  }

  const session = await loadNfcSessionRow(supabase, sessionId);
  if (!session?.profile_id) {
    return null;
  }

  if (!isNfcSessionTwentyFourHourPolicyValid(session)) {
    return null;
  }

  const sessionSlug = await resolveNfcSlugByCardUuid(supabase, session.nfc_id);
  if (!sessionSlug || sessionSlug !== normalizedScan) {
    return null;
  }

  await touchNfcSessionActivity(supabase, session.id);

  return DASHBOARD_PATH;
}
