import "server-only";

import { cookies } from "next/headers";
import { NFC_SESSION_COOKIE } from "@/lib/nfc/constants";
import { trySmartNfcSessionEntry } from "@/lib/nfc/smart-session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function resolveSmartNfcEntryRedirect(
  uniqueId: string,
  options?: { clientLastLoginMs?: number | null }
): Promise<string | null> {
  const normalizedId = normalizeNfcUniqueId(uniqueId);
  if (!normalizedId) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(NFC_SESSION_COOKIE)?.value?.trim() ?? "";

  if (!sessionId) {
    return null;
  }

  const admin = createServiceRoleClient();
  return trySmartNfcSessionEntry(admin, normalizedId, sessionId, options);
}
