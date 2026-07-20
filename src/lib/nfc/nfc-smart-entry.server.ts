import "server-only";

import { cookies } from "next/headers";
import { NFC_SESSION_COOKIE } from "@/lib/nfc/constants";
import { logNfcDebug } from "@/lib/nfc/nfc-debug.server";
import { resolveNfcModuleDestination } from "@/lib/nfc/nfc-entry-destination.server";
import { trySmartNfcSessionEntry } from "@/lib/nfc/smart-session.server";
import { setPostAuthReturnToCookie } from "@/lib/nfc/post-pin-redirect.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function resolveSmartNfcEntryRedirect(
  uniqueId: string,
  options?: {
    clientLastLoginMs?: number | null;
    searchParams?: Record<string, string | string[] | undefined>;
  }
): Promise<string | null> {
  const normalizedId = normalizeNfcUniqueId(uniqueId);

  const moduleDestination = resolveNfcModuleDestination(options?.searchParams);
  if (moduleDestination) {
    await setPostAuthReturnToCookie(moduleDestination);
    logNfcDebug("resolveSmartNfcEntryRedirect:module-cookie-set", {
      normalizedId,
      moduleDestination,
    });
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(NFC_SESSION_COOKIE)?.value?.trim() ?? "";

  logNfcDebug("resolveSmartNfcEntryRedirect:start", {
    normalizedId,
    sessionTokenPresent: Boolean(sessionId),
    sessionTokenPrefix: sessionId ? `${sessionId.slice(0, 8)}…` : null,
    moduleDestination,
    searchParams: options?.searchParams ?? null,
  });

  if (!normalizedId) {
    logNfcDebug("resolveSmartNfcEntryRedirect:abort", { reason: "invalid_nfc_id" });
    return null;
  }

  if (!sessionId) {
    logNfcDebug("resolveSmartNfcEntryRedirect:abort", { reason: "missing_session_cookie" });
    return null;
  }

  const admin = createServiceRoleClient();
  const result = await trySmartNfcSessionEntry(admin, normalizedId, sessionId, options);

  if (!result.ok) {
    logNfcDebug("resolveSmartNfcEntryRedirect:smart-entry-failed", {
      reason: result.reason,
      normalizedId,
    });
    return null;
  }

  logNfcDebug("resolveSmartNfcEntryRedirect:redirect", {
    redirectTo: result.redirectTo,
    normalizedId,
  });

  return result.redirectTo;
}
