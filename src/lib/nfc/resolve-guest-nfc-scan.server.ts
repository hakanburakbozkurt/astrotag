import "server-only";

import { nfcLoginPathForUniqueId } from "@/lib/nfc/card-paths";
import { logNfcDebug } from "@/lib/nfc/nfc-debug.server";
import { resolveNfcModuleDestination } from "@/lib/nfc/nfc-entry-destination.server";
import { resolveNfcScanAccess } from "@/lib/nfc/nfc-scan-access.server";
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
      mode: "owner_session" | "pin_required";
    }
  | { ok: false; reason: GuestNfcScanFailureReason };

/**
 * /c/{at_xxx} — kart sahibi oturumu yoksa PIN ekranına yönlendir; veri sızdırma yok.
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

  const moduleDestination = resolveNfcModuleDestination(options?.searchParams);
  if (moduleDestination) {
    const { setPostAuthReturnToCookie } = await import(
      "@/lib/nfc/post-pin-redirect.server"
    );
    await setPostAuthReturnToCookie(moduleDestination);
  }

  const access = await resolveNfcScanAccess(uniqueId, options);

  if (access.ok) {
    logNfcDebug("resolveGuestNfcScanRedirect:owner-session", {
      uniqueId,
      redirectTo: access.redirectTo,
    });
    return {
      ok: true,
      redirectTo: access.redirectTo,
      mode: "owner_session",
    };
  }

  if (access.reason === "account_suspended") {
    return {
      ok: true,
      redirectTo: access.pinEntryPath,
      mode: "pin_required",
    };
  }

  if (
    access.reason === "inactive" ||
    access.reason === "card_not_found" ||
    access.reason === "db_error" ||
    access.reason === "invalid_format"
  ) {
    const reasonMap: Record<string, GuestNfcScanFailureReason> = {
      inactive: "inactive",
      card_not_found: "not_found",
      db_error: "db_error",
      invalid_format: "invalid_format",
    };
    return { ok: false, reason: reasonMap[access.reason] ?? "db_error" };
  }

  logNfcDebug("resolveGuestNfcScanRedirect:pin-required", {
    uniqueId,
    reason: access.reason,
    pinEntryPath: access.pinEntryPath,
  });

  return {
    ok: true,
    redirectTo: access.pinEntryPath || nfcLoginPathForUniqueId(uniqueId),
    mode: "pin_required",
  };
}
