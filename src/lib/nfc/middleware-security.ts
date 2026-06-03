import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { nfcPairingPathForUniqueId } from "@/lib/nfc/card-paths";
import {
  CARD_ENTRY_PREFIX,
  HOME_PATH,
  NFC_FINGERPRINT_COOKIE,
  NFC_SESSION_COOKIE,
  PENDING_NFC_COOKIE,
  PRIVATE_MODE_PATH,
  PUBLIC_PATHS,
  STORAGE_VERIFIED_COOKIE,
} from "@/lib/nfc/constants";
import { isValidFingerprintHash } from "@/lib/nfc/fingerprint-utils";
import {
  getCookiePresence,
  logNfcError,
  logNfcEvent,
  sanitizeRequestHeaders,
} from "@/lib/nfc/error-logger";

const GATE_LOG = { layer: "security-gate" as const, handler: "runSecurityGate" };

function logGateDeny(
  request: NextRequest,
  reason: SecurityDenyReason,
  redirectTo: string,
  extra?: Record<string, unknown>
): void {
  logNfcEvent("warn", GATE_LOG, `Erişim reddedildi: ${reason}`, {
    reason,
    redirectTo,
    pathname: request.nextUrl.pathname,
    method: request.method,
    cookies: getCookiePresence(request.cookies),
    requestHeaders: sanitizeRequestHeaders(request.headers),
    ...extra,
  });
}

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

function sessionMissingRedirect(request: NextRequest): string {
  const pending = request.cookies.get(PENDING_NFC_COOKIE)?.value?.trim();
  if (pending) {
    return nfcPairingPathForUniqueId(pending);
  }
  return HOME_PATH;
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
  | { ok: true }
  | { ok: false; reason: "session_expired" | "fingerprint_mismatch" | "session_missing" }
> {
  const { data, error } = await supabase
    .from("nfc_sessions")
    .select("id, nfc_id, fingerprint, expires_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    logNfcError(
      { layer: "security-gate", handler: "validateSessionRecord" },
      error,
      { sessionId, dbError: error.message, dbCode: error.code }
    );
    return { ok: false, reason: "session_missing" };
  }

  if (!data?.nfc_id) {
    return { ok: false, reason: "session_missing" };
  }

  if (data.fingerprint !== fingerprint) {
    return { ok: false, reason: "fingerprint_mismatch" };
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return { ok: false, reason: "session_expired" };
  }

  const { data: rpcValid, error: rpcError } = await supabase.rpc(
    "is_valid_nfc_session",
    {
      p_nfc_id: data.nfc_id,
      p_fingerprint: fingerprint,
    }
  );

  if (rpcError) {
    logNfcError(
      { layer: "security-gate", handler: "is_valid_nfc_session" },
      rpcError,
      { sessionId, nfcId: data.nfc_id, rpcCode: rpcError.code }
    );
    return { ok: false, reason: "session_expired" };
  }

  if (!rpcValid) {
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

  return { ok: true };
}

/**
 * Korunan rotalar: yalnızca NFC oturum çerezi + fingerprint doğrulaması.
 */
export async function runSecurityGate(
  request: NextRequest,
  supabase: SupabaseClient | null
): Promise<SecurityGateResult> {
  try {
    const { pathname } = request.nextUrl;

    if (shouldRedirectUnknownToHome(pathname)) {
      const deny = {
        allowed: false as const,
        reason: "unauthorized_route" as const,
        redirectTo: HOME_PATH,
      };
      logGateDeny(request, deny.reason, deny.redirectTo);
      return deny;
    }

    if (isCardEntryPath(pathname)) {
      const uniqueId = pathname
        .slice(`${CARD_ENTRY_PREFIX}/`.length)
        .split("/")[0];

      if (!uniqueId || !supabase) {
        const deny = {
          allowed: false as const,
          reason: "nfc_card_inactive" as const,
          redirectTo: HOME_PATH,
        };
        logGateDeny(request, deny.reason, deny.redirectTo, {
          uniqueId: uniqueId ?? null,
          supabaseClient: Boolean(supabase),
        });
        return deny;
      }

      const cardActive = await validateNfcCard(supabase, uniqueId);
      if (!cardActive) {
        const deny = {
          allowed: false as const,
          reason: "nfc_card_inactive" as const,
          redirectTo: HOME_PATH,
        };
        logGateDeny(request, deny.reason, deny.redirectTo, { uniqueId });
        return deny;
      }

      return { allowed: true };
    }

    if (!isStorageCheckRequired(pathname)) {
      return { allowed: true };
    }

    const storageVerified =
      request.cookies.get(STORAGE_VERIFIED_COOKIE)?.value === "1";

    if (!storageVerified) {
      const deny = {
        allowed: false as const,
        reason: "private_mode" as const,
        redirectTo: PRIVATE_MODE_PATH,
      };
      logGateDeny(request, deny.reason, deny.redirectTo);
      return deny;
    }

    if (!isProtectedPath(pathname)) {
      return { allowed: true };
    }

    const sessionId = request.cookies.get(NFC_SESSION_COOKIE)?.value?.trim();
    const fingerprint = request.cookies.get(NFC_FINGERPRINT_COOKIE)?.value?.trim();

    if (!sessionId || !isValidFingerprintHash(fingerprint)) {
      const redirectTo = sessionMissingRedirect(request);
      const deny = {
        allowed: false as const,
        reason: "session_missing" as const,
        redirectTo,
      };
      logGateDeny(request, deny.reason, deny.redirectTo, {
        hasSessionId: Boolean(sessionId),
        fingerprintValid: isValidFingerprintHash(fingerprint),
        pendingNfc: request.cookies.get(PENDING_NFC_COOKIE)?.value ?? null,
      });
      return deny;
    }

    const fp = fingerprint as string;

    if (!supabase) {
      const deny = {
        allowed: false as const,
        reason: "session_missing" as const,
        redirectTo: HOME_PATH,
      };
      logGateDeny(request, deny.reason, deny.redirectTo, {
        supabaseClient: false,
      });
      return deny;
    }

    const sessionCheck = await validateSessionRecord(
      supabase,
      sessionId,
      fp
    );

    if (!sessionCheck.ok) {
      const redirectTo =
        sessionCheck.reason === "session_missing"
          ? sessionMissingRedirect(request)
          : HOME_PATH;
      const deny = {
        allowed: false as const,
        reason: sessionCheck.reason,
        redirectTo,
      };
      logGateDeny(request, deny.reason, deny.redirectTo, {
        sessionId,
        sessionCheckReason: sessionCheck.reason,
        pendingNfc: request.cookies.get(PENDING_NFC_COOKIE)?.value ?? null,
      });
      return deny;
    }

    return { allowed: true };
  } catch (error) {
    logNfcError(GATE_LOG, error, {
      pathname: request.nextUrl.pathname,
      method: request.method,
      cookies: getCookiePresence(request.cookies),
      requestHeaders: sanitizeRequestHeaders(request.headers),
      supabaseClient: Boolean(supabase),
    });
    throw error;
  }
}
