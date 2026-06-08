import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { authSignupPathClean, isAuthFormPath } from "@/lib/nfc/auth-paths";
import {
  extractRootUniqueId,
  isRootCardEntryPath,
} from "@/lib/nfc/card-paths";
import {
  AUTH_CALLBACK_PATH,
  CARD_ENTRY_PREFIX,
  DASHBOARD_PATH,
  HOME_PATH,
  NFC_SESSION_COOKIE,
  PENDING_NFC_COOKIE,
  PRIVATE_MODE_PATH,
  PROFILE_COMPLETE_PATH,
  PUBLIC_PATHS,
  PUBLIC_PROFILE_PREFIX,
  STORAGE_VERIFIED_COOKIE,
} from "@/lib/nfc/constants";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
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
  | "session_expired"
  | "invalid_card_route"
  | "unauthorized_route";

export type SecurityGateResult =
  | { allowed: true }
  | { allowed: false; reason: SecurityDenyReason; redirectTo: string };

function isCardEntryPath(pathname: string): boolean {
  return pathname.startsWith(`${CARD_ENTRY_PREFIX}/`);
}

function isPublicProfilePath(pathname: string): boolean {
  return pathname.startsWith(`${PUBLIC_PROFILE_PREFIX}/`);
}

function isWarningPath(pathname: string): boolean {
  return pathname.startsWith(PRIVATE_MODE_PATH);
}

function isAuthCallbackPath(pathname: string): boolean {
  return (
    pathname === AUTH_CALLBACK_PATH ||
    pathname.startsWith(`${AUTH_CALLBACK_PATH}/`)
  );
}

export function isProtectedPath(pathname: string): boolean {
  if (isAuthFormPath(pathname)) {
    return false;
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return false;
  }

  if (
    isCardEntryPath(pathname) ||
    isPublicProfilePath(pathname) ||
    isRootCardEntryPath(pathname) ||
    isWarningPath(pathname)
  ) {
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
    pathname.startsWith(DASHBOARD_PATH) ||
    pathname === PROFILE_COMPLETE_PATH ||
    pathname.startsWith("/api/ai")
  );
}

/** /c/, /p/ ve /{unique_id} — kart is_active middleware kontrolü */
function isNfcCardRoutePath(pathname: string): boolean {
  return (
    isCardEntryPath(pathname) ||
    isPublicProfilePath(pathname) ||
    isRootCardEntryPath(pathname)
  );
}

function resolveUniqueIdFromCardRoute(pathname: string): string {
  if (isCardEntryPath(pathname)) {
    return normalizeNfcUniqueId(
      pathname.slice(`${CARD_ENTRY_PREFIX}/`.length).split("/")[0]
    );
  }

  if (isPublicProfilePath(pathname)) {
    return normalizeNfcUniqueId(
      pathname.slice(`${PUBLIC_PROFILE_PREFIX}/`.length).split("/")[0]
    );
  }

  return extractRootUniqueId(pathname) ?? "";
}

export function shouldRedirectUnknownToHome(pathname: string): boolean {
  if (pathname === HOME_PATH) {
    return false;
  }

  /** Eski NFC etiket formatı: /c/{unique_id} — shape ne olursa olsun ana sayfaya atma */
  if (
    pathname === CARD_ENTRY_PREFIX ||
    pathname.startsWith(`${CARD_ENTRY_PREFIX}/`)
  ) {
    return false;
  }

  if (isNfcCardRoutePath(pathname) || isAuthFormPath(pathname) || isWarningPath(pathname)) {
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
  const { pathname, search } = request.nextUrl;

  if (isAuthFormPath(pathname)) {
    return `${pathname}${search}`;
  }

  const pending = request.cookies.get(PENDING_NFC_COOKIE)?.value?.trim();
  if (pending) {
    return authSignupPathClean();
  }
  return HOME_PATH;
}

async function validateSessionRecord(
  supabase: SupabaseClient,
  sessionId: string
): Promise<
  | { ok: true }
  | { ok: false; reason: "session_expired" | "session_missing" }
> {
  const { data, error } = await supabase
    .from("nfc_sessions")
    .select("id, nfc_id, expires_at")
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

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return { ok: false, reason: "session_expired" };
  }

  return { ok: true };
}

/**
 * Korunan rotalar: yalnızca NFC oturum çerezi (session token) doğrulaması.
 */
export async function runSecurityGate(
  request: NextRequest,
  supabase: SupabaseClient | null
): Promise<SecurityGateResult> {
  try {
    const { pathname } = request.nextUrl;

    if (isAuthCallbackPath(pathname)) {
      return { allowed: true };
    }

    if (isAuthFormPath(pathname)) {
      return { allowed: true };
    }

    if (shouldRedirectUnknownToHome(pathname)) {
      const deny = {
        allowed: false as const,
        reason: "unauthorized_route" as const,
        redirectTo: HOME_PATH,
      };
      logGateDeny(request, deny.reason, deny.redirectTo);
      return deny;
    }

    if (isNfcCardRoutePath(pathname)) {
      const uniqueId = resolveUniqueIdFromCardRoute(pathname);

      if (!uniqueId) {
        const deny = {
          allowed: false as const,
          reason: "invalid_card_route" as const,
          redirectTo: HOME_PATH,
        };
        logGateDeny(request, deny.reason, deny.redirectTo);
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

    if (pathname === PROFILE_COMPLETE_PATH) {
      const pendingNfc = request.cookies.get(PENDING_NFC_COOKIE)?.value?.trim();
      if (pendingNfc) {
        return { allowed: true };
      }
    }

    const sessionId = request.cookies.get(NFC_SESSION_COOKIE)?.value?.trim();

    if (!sessionId) {
      const redirectTo = sessionMissingRedirect(request);
      const deny = {
        allowed: false as const,
        reason: "session_missing" as const,
        redirectTo,
      };
      logGateDeny(request, deny.reason, deny.redirectTo, {
        hasSessionId: false,
        pendingNfc: request.cookies.get(PENDING_NFC_COOKIE)?.value ?? null,
      });
      return deny;
    }

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

    const sessionCheck = await validateSessionRecord(supabase, sessionId);

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
