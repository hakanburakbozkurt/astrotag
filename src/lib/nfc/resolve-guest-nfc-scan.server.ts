import "server-only";

import { publicProfilePathForUniqueId } from "@/lib/nfc/card-paths";
import { establishNfcTapSession } from "@/lib/nfc/establish-tap-session.server";
import { logNfcDebug } from "@/lib/nfc/nfc-debug.server";
import { resolveNfcModuleDestination } from "@/lib/nfc/nfc-entry-destination.server";
import { resolveSmartNfcEntryRedirect } from "@/lib/nfc/nfc-smart-entry.server";
import { validateNfcCardActive } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

export type GuestNfcScanFailureReason =
  | "invalid_format"
  | "config_error"
  | "not_found"
  | "inactive"
  | "db_error";

export type GuestNfcScanRedirectResult =
  | {
      ok: true;
      redirectTo: string;
      mode: "smart_session" | "tap_session" | "guest_public" | "guest_module";
    }
  | { ok: false; reason: GuestNfcScanFailureReason };

/**
 * /c/{at_xxx} — oturum zorunlu değil.
 * Kart eşleşince tap oturumu aç → dashboard; profil yoksa /p/.
 */
export async function resolveGuestNfcScanRedirect(
  rawUniqueId: string,
  options?: {
    searchParams?: Record<string, string | string[] | undefined>;
    clientLastLoginMs?: number | null;
  }
): Promise<GuestNfcScanRedirectResult> {
  const uniqueId = normalizeNfcUniqueId(rawUniqueId);

  logNfcDebug("resolveGuestNfcScanRedirect:start", {
    rawUniqueId,
    uniqueId,
    searchParams: options?.searchParams ?? null,
  });

  if (!uniqueId.startsWith("at_")) {
    return { ok: false, reason: "invalid_format" };
  }

  const card = await validateNfcCardActive(uniqueId);
  if (!card.ok) {
    logNfcDebug("resolveGuestNfcScanRedirect:card-invalid", {
      uniqueId,
      reason: card.reason,
    });
    return { ok: false, reason: card.reason };
  }

  const moduleDestination = resolveNfcModuleDestination(options?.searchParams);

  const smartRedirect = await resolveSmartNfcEntryRedirect(uniqueId, options);
  if (smartRedirect) {
    logNfcDebug("resolveGuestNfcScanRedirect:smart-session", {
      uniqueId,
      redirectTo: smartRedirect,
    });
    return { ok: true, redirectTo: smartRedirect, mode: "smart_session" };
  }

  const tapSession = await establishNfcTapSession(uniqueId, {
    returnTo: moduleDestination ?? undefined,
  });

  if (tapSession.ok) {
    logNfcDebug("resolveGuestNfcScanRedirect:tap-session", {
      uniqueId,
      redirectTo: tapSession.redirectTo,
    });
    return {
      ok: true,
      redirectTo: tapSession.redirectTo,
      mode: "tap_session",
    };
  }

  if (moduleDestination) {
    logNfcDebug("resolveGuestNfcScanRedirect:guest-module-fallback", {
      uniqueId,
      fallback: tapSession.fallbackTo,
    });
    return {
      ok: true,
      redirectTo: tapSession.fallbackTo,
      mode: "guest_module",
    };
  }

  const publicProfilePath = publicProfilePathForUniqueId(uniqueId);
  logNfcDebug("resolveGuestNfcScanRedirect:guest-public", {
    uniqueId,
    redirectTo: publicProfilePath,
    profileId: card.profileId,
    tapReason: tapSession.reason,
  });

  return {
    ok: true,
    redirectTo: publicProfilePath,
    mode: "guest_public",
  };
}
