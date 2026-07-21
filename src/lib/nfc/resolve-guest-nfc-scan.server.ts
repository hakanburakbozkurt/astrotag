import "server-only";

import { publicProfilePathForUniqueId } from "@/lib/nfc/card-paths";
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
  | { ok: true; redirectTo: string; mode: "smart_session" | "guest_public" | "guest_module" }
  | { ok: false; reason: GuestNfcScanFailureReason };

/** Misafir NFC taraması — dashboard oturumu gerekmez */
function mapGuestModuleDestination(
  moduleDestination: string,
  uniqueId: string
): string {
  if (
    moduleDestination.startsWith("/dashboard/nexus") ||
    moduleDestination.includes("module=nexus")
  ) {
    return `${publicProfilePathForUniqueId(uniqueId)}?cosmic=nexus`;
  }

  if (
    moduleDestination.startsWith("/dashboard/profile") ||
    moduleDestination.includes("module=cosmic-profile")
  ) {
    return publicProfilePathForUniqueId(uniqueId);
  }

  if (moduleDestination.startsWith("/dashboard")) {
    return publicProfilePathForUniqueId(uniqueId);
  }

  return moduleDestination;
}

/**
 * /c/{at_xxx} — oturum zorunlu değil.
 * Kart DB'de eşleşirse herkese açık kozmik profile veya (oturum varsa) dashboard hedefi.
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

  const smartRedirect = await resolveSmartNfcEntryRedirect(uniqueId, options);
  if (smartRedirect) {
    logNfcDebug("resolveGuestNfcScanRedirect:smart-session", {
      uniqueId,
      redirectTo: smartRedirect,
    });
    return { ok: true, redirectTo: smartRedirect, mode: "smart_session" };
  }

  const moduleDestination = resolveNfcModuleDestination(options?.searchParams);
  if (moduleDestination) {
    const guestDestination = mapGuestModuleDestination(moduleDestination, uniqueId);
    logNfcDebug("resolveGuestNfcScanRedirect:guest-module", {
      uniqueId,
      moduleDestination,
      guestDestination,
    });
    return {
      ok: true,
      redirectTo: guestDestination,
      mode: "guest_module",
    };
  }

  const publicProfilePath = publicProfilePathForUniqueId(uniqueId);
  logNfcDebug("resolveGuestNfcScanRedirect:guest-public", {
    uniqueId,
    redirectTo: publicProfilePath,
    profileId: card.profileId,
  });

  return {
    ok: true,
    redirectTo: publicProfilePath,
    mode: "guest_public",
  };
}
