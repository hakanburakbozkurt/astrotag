import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import {
  CARD_ENTRY_PREFIX,
  HOME_PATH,
  NFC_FINGERPRINT_COOKIE,
  NFC_SESSION_COOKIE,
  PRIVATE_MODE_PATH,
  PUBLIC_PATHS,
  STORAGE_VERIFIED_COOKIE,
} from "@/lib/nfc/constants";
import { isValidFingerprintHash } from "@/lib/nfc/fingerprint-utils";

export type SecurityDenyReason =
  | "private_mode"
  | "session_missing"
  | "fingerprint_invalid"
  | "session_expired"
  | "fingerprint_mismatch"
  | "nfc_card_inactive"
  | "unauthorized_route";

export type SecurityGateResult =
  | { allowed: true }
  | { allowed: false; reason: SecurityDenyReason; redirectTo: string };

function isCardEntryPath(pathname: string): boolean {
  return pathname.startsWith(`${CARD_ENTRY_PREFIX}/`);
}

function isWarningPath(pathname: string): boolean {
  return pathname.startsWith(PRIVATE_MODE_PATH);
}

export function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return false;
  }

  if (isCardEntryPath(pathname) || isWarningPath(pathname)) {
    return false;
  }

  if (pathname.startsWith("/api/debug-log")) {
    return false;
  }

  if (pathname.startsWith("/.well-known")) {
    return false;
  }

  if (pathname === "/manifest.json" || pathname === "/sw.js") {
    return false;
  }

  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/api/ai")
  );
}

/** /c/* ve / dışındaki, korunan olmayan rotalar → ana sayfa */
export function shouldRedirectUnknownToHome(pathname: string): boolean {
  if (pathname === HOME_PATH) {
    return false;
  }

  if (isCardEntryPath(pathname)) {
    return false;
  }

  if (isWarningPath(pathname)) {
    return false;
  }

  if (isProtectedPath(pathname)) {
    return false;
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/.well-known")
  ) {
    return false;
  }

  return true;
}

function isStorageCheckRequired(pathname: string): boolean {
  return isProtectedPath(pathname);
}

async function validateNfcCard(
  supabase: SupabaseClient,
  uniqueId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("nfc_cards")
    .select("is_active")
    .eq("unique_id", uniqueId)
    .maybeSingle();

  return !error && Boolean(data?.is_active);
}

async function validateSessionRecord(
  supabase: SupabaseClient,
  sessionId: string,
  fingerprint: string
): Promise<
  | { ok: true; nfcId: string }
  | { ok: false; reason: "session_expired" | "fingerprint_mismatch" | "session_missing" }
> {
  const { data, error } = await supabase
    .from("nfc_sessions")
    .select("id, nfc_id, fingerprint, expires_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data?.nfc_id) {
    return { ok: false, reason: "session_missing" };
  }

  if (data.fingerprint !== fingerprint) {
    return { ok: false, reason: "fingerprint_mismatch" };
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return { ok: false, reason: "session_expired" };
  }

  const { data: conflicting } = await supabase
    .from("nfc_sessions")
    .select("fingerprint")
    .eq("nfc_id", data.nfc_id)
    .gt("expires_at", new Date().toISOString())
    .neq("id", sessionId)
    .limit(1)
    .maybeSingle();

  if (conflicting?.fingerprint && conflicting.fingerprint !== fingerprint) {
    return { ok: false, reason: "fingerprint_mismatch" };
  }

  return { ok: true, nfcId: data.nfc_id };
}

/**
 * Merkezi güvenlik katmanı — fingerprint + gizli sekme + oturum + rota.
 */
export async function runSecurityGate(
  request: NextRequest,
  supabase: SupabaseClient | null
): Promise<SecurityGateResult> {
  const { pathname } = request.nextUrl;

  if (shouldRedirectUnknownToHome(pathname)) {
    return {
      allowed: false,
      reason: "unauthorized_route",
      redirectTo: HOME_PATH,
    };
  }

  if (isCardEntryPath(pathname)) {
    const uniqueId = pathname
      .slice(`${CARD_ENTRY_PREFIX}/`.length)
      .split("/")[0];

    if (!uniqueId || !supabase) {
      return {
        allowed: false,
        reason: "nfc_card_inactive",
        redirectTo: HOME_PATH,
      };
    }

    const cardActive = await validateNfcCard(supabase, uniqueId);
    if (!cardActive) {
      return {
        allowed: false,
        reason: "nfc_card_inactive",
        redirectTo: HOME_PATH,
      };
    }

    return { allowed: true };
  }

  if (!isStorageCheckRequired(pathname)) {
    return { allowed: true };
  }

  const storageVerified =
    request.cookies.get(STORAGE_VERIFIED_COOKIE)?.value === "1";

  if (!storageVerified) {
    return {
      allowed: false,
      reason: "private_mode",
      redirectTo: PRIVATE_MODE_PATH,
    };
  }

  if (!isProtectedPath(pathname)) {
    return { allowed: true };
  }

  const sessionId = request.cookies.get(NFC_SESSION_COOKIE)?.value?.trim();
  const fingerprint = request.cookies.get(NFC_FINGERPRINT_COOKIE)?.value?.trim();

  if (!sessionId || !isValidFingerprintHash(fingerprint)) {
    return {
      allowed: false,
      reason: "session_missing",
      redirectTo: HOME_PATH,
    };
  }

  const fp = fingerprint as string;

  if (!supabase) {
    return {
      allowed: false,
      reason: "session_missing",
      redirectTo: HOME_PATH,
    };
  }

  const sessionCheck = await validateSessionRecord(
    supabase,
    sessionId,
    fp
  );

  if (!sessionCheck.ok) {
    return {
      allowed: false,
      reason: sessionCheck.reason,
      redirectTo: HOME_PATH,
    };
  }

  return { allowed: true };
}
