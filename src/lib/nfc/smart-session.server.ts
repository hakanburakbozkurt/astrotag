import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { DASHBOARD_PATH, PROFILE_SETUP_PATH } from "@/lib/nfc/constants";
import {
  isNfcSessionExpired,
  isNfcSessionIdle,
  loadNfcSessionRow,
  resolveNfcSlugByCardUuid,
  touchNfcSessionActivity,
} from "@/lib/nfc/nfc-session-activity.server";
import { isProfileComplete } from "@/lib/nfc/profile-readiness.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

/**
 * Geçerli oturum + aynı kart NFC okutması → PIN bypass, dashboard veya profile-setup.
 */
export async function trySmartNfcSessionEntry(
  supabase: SupabaseClient,
  scannedUniqueId: string,
  sessionId: string
): Promise<string | null> {
  const normalizedScan = normalizeNfcUniqueId(scannedUniqueId);
  if (!normalizedScan || !sessionId.trim()) {
    return null;
  }

  const session = await loadNfcSessionRow(supabase, sessionId);
  if (!session?.profile_id) {
    return null;
  }

  if (isNfcSessionExpired(session.expires_at)) {
    return null;
  }

  if (isNfcSessionIdle(session.last_active_at)) {
    return null;
  }

  const sessionSlug = await resolveNfcSlugByCardUuid(supabase, session.nfc_id);
  if (!sessionSlug || sessionSlug !== normalizedScan) {
    return null;
  }

  await touchNfcSessionActivity(supabase, session.id);

  const profileComplete = await isProfileComplete(supabase, session.profile_id);
  return profileComplete ? DASHBOARD_PATH : PROFILE_SETUP_PATH;
}
