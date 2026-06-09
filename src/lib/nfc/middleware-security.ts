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

type GateDiagnostics = {
  pathname: string;
  method: string;
  search: string;
  supabaseAvailable: boolean;
  checks: {
    isAuthCallbackPath: boolean;
    isAuthFormPath: boolean;
    shouldRedirectUnknownToHome: boolean;
    shouldRedirectUnknownBreakdown: {
      isHome: boolean;
      isLegacyCardPrefix: boolean;
      isNfcCardRoutePath: boolean;
      isAuthFormPath: boolean;
      isWarningPath: boolean;
      isProtectedPath: boolean;
      isStaticOrApi: boolean;
      wouldRedirectToHome: boolean;
    };
    isNfcCardRoutePath: boolean;
    resolvedUniqueId: string | null;
    isStorageCheckRequired: boolean;
    storageVerified: boolean;
    isProtectedPath: boolean;
    profileCompleteWithPendingNfc: boolean;
    hasSessionId: boolean;
    hasPendingNfc: boolean;
  };
  cookies: ReturnType<typeof getCookiePresence>;
};

function buildShouldRedirectUnknownBreakdown(pathname: string) {
  const isHome = pathname === HOME_PATH;
  const isLegacyCardPrefix = isLegacyCardEntryPrefix(pathname);
  const nfcCardRoute = isNfcCardRoutePath(pathname);
  const authForm = isAuthFormPath(pathname);
  const warning = isWarningPath(pathname);
  const protectedPath = isProtectedPath(pathname);
  const isStaticOrApi =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/.well-known");

  return {
    isHome,
    isLegacyCardPrefix,
    isNfcCardRoutePath: nfcCardRoute,
    isAuthFormPath: authForm,
    isWarningPath: warning,
    isProtectedPath: protectedPath,
    isStaticOrApi,
    wouldRedirectToHome: shouldRedirectUnknownToHome(pathname),
  };
}

function buildGateDiagnostics(
  request: NextRequest,
  supabase: SupabaseClient | null
): GateDiagnostics {
  const { pathname, search } = request.nextUrl;
  const shouldRedirectBreakdown = buildShouldRedirectUnknownBreakdown(pathname);
  const nfcCardRoute = isNfcCardRoutePath(pathname);
  const resolvedUniqueId = nfcCardRoute
    ? resolveUniqueIdFromCardRoute(pathname) || null
    : null;
  const pendingNfc = request.cookies.get(PENDING_NFC_COOKIE)?.value?.trim() ?? "";
  const sessionId = request.cookies.get(NFC_SESSION_COOKIE)?.value?.trim() ?? "";

  return {
    pathname,
    method: request.method,
    search,
    supabaseAvailable: Boolean(supabase),
    checks: {
      isAuthCallbackPath: isAuthCallbackPath(pathname),
      isAuthFormPath: isAuthFormPath(pathname),
      shouldRedirectUnknownToHome: shouldRedirectBreakdown.wouldRedirectToHome,
      shouldRedirectUnknownBreakdown: shouldRedirectBreakdown,
      isNfcCardRoutePath: nfcCardRoute,
      resolvedUniqueId,
      isStorageCheckRequired: isStorageCheckRequired(pathname),
      storageVerified:
        request.cookies.get(STORAGE_VERIFIED_COOKIE)?.value === "1",
      isProtectedPath: isProtectedPath(pathname),
      profileCompleteWithPendingNfc:
        pathname === PROFILE_COMPLETE_PATH && Boolean(pendingNfc),
      hasSessionId: Boolean(sessionId),
      hasPendingNfc: Boolean(pendingNfc),
    },
    cookies: getCookiePresence(request.cookies),
  };
}

function logGateEntry(
  request: NextRequest,
  supabase: SupabaseClient | null
): GateDiagnostics {
  const diagnostics = buildGateDiagnostics(request, supabase);

  logNfcEvent("info", GATE_LOG, "runSecurityGate giriş", diagnostics);
  console.log("[runSecurityGate] giriş:", JSON.stringify(diagnostics, null, 2));

  return diagnostics;
}

function logGateDeny(
  request: NextRequest,
  reason: SecurityDenyReason,
  redirectTo: string,
  diagnostics: GateDiagnostics,
  denyBranch: string,
  extra?: Record<string, unknown>
): void {
  const payload = {
    reason,
    redirectTo,
    denyBranch,
    pathname: request.nextUrl.pathname,
    method: request.method,
    diagnostics,
    cookies: getCookiePresence(request.cookies),
    requestHeaders: sanitizeRequestHeaders(request.headers),
    ...extra,
  };

  logNfcEvent("warn", GATE_LOG, `Erişim reddedildi: ${reason}`, payload);
  console.warn(
    `[runSecurityGate] Erişim reddedildi: ${reason} | branch=${denyBranch}`,
    JSON.stringify(payload, null, 2)
  );
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

/** NFC etiket formatı: /c ve /c/... — büyük/küçük harf duyarsız */
function isLegacyCardEntryPrefix(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return (
    normalized === CARD_ENTRY_PREFIX ||
    normalized.startsWith(`${CARD_ENTRY_PREFIX}/`)
  );
}

function isCardEntryPath(pathname: string): boolean {
  return isLegacyCardEntryPrefix(pathname);
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
    const lower = pathname.toLowerCase();
    const prefixLen = `${CARD_ENTRY_PREFIX}/`.length;
    return normalizeNfcUniqueId(
      lower.slice(prefixLen).split("/")[0]
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
  if (isLegacyCardEntryPrefix(pathname)) {
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
  const diagnostics = logGateEntry(request, supabase);

  try {
    const { pathname } = request.nextUrl;

    if (isAuthCallbackPath(pathname)) {
      return { allowed: true };
    }

    if (isAuthFormPath(pathname)) {
      return { allowed: true };
    }

    /** NFC etiket (/c/xyz) — unknown-route filtresinden önce; session gerekmez */
    if (isLegacyCardEntryPrefix(pathname) || isNfcCardRoutePath(pathname)) {
      const uniqueId = resolveUniqueIdFromCardRoute(pathname);

      if (!uniqueId) {
        const deny = {
          allowed: false as const,
          reason: "invalid_card_route" as const,
          redirectTo: HOME_PATH,
        };
        logGateDeny(
          request,
          deny.reason,
          deny.redirectTo,
          diagnostics,
          "NFC kart rotası → uniqueId boş (session kontrolü yapılmadı)",
          { resolvedUniqueId: uniqueId }
        );
        return deny;
      }

      return { allowed: true };
    }

    if (shouldRedirectUnknownToHome(pathname)) {
      const deny = {
        allowed: false as const,
        reason: "unauthorized_route" as const,
        redirectTo: HOME_PATH,
      };
      logGateDeny(
        request,
        deny.reason,
        deny.redirectTo,
        diagnostics,
        "shouldRedirectUnknownToHome → tanınmayan rota (session kontrolü yapılmadı)"
      );
      return deny;
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
      logGateDeny(
        request,
        deny.reason,
        deny.redirectTo,
        diagnostics,
        "storageVerified=false → astrotag_storage_ok çerezi yok",
        { storageVerified }
      );
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
      logGateDeny(
        request,
        deny.reason,
        deny.redirectTo,
        diagnostics,
        "sessionId yok → astrotag_nfc_session çerezi eksik",
        {
          hasSessionId: false,
          pendingNfc: request.cookies.get(PENDING_NFC_COOKIE)?.value ?? null,
        }
      );
      return deny;
    }

    if (!supabase) {
      const deny = {
        allowed: false as const,
        reason: "session_missing" as const,
        redirectTo: HOME_PATH,
      };
      logGateDeny(
        request,
        deny.reason,
        deny.redirectTo,
        diagnostics,
        "supabase null → SUPABASE_SERVICE_ROLE_KEY veya URL eksik",
        { supabaseClient: false, sessionIdPresent: true }
      );
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
      logGateDeny(
        request,
        deny.reason,
        deny.redirectTo,
        diagnostics,
        `validateSessionRecord → ${sessionCheck.reason}`,
        {
          sessionId,
          sessionCheckReason: sessionCheck.reason,
          pendingNfc: request.cookies.get(PENDING_NFC_COOKIE)?.value ?? null,
        }
      );
      return deny;
    }

    return { allowed: true };
  } catch (error) {
    logNfcError(GATE_LOG, error, {
      pathname: request.nextUrl.pathname,
      method: request.method,
      diagnostics,
      cookies: getCookiePresence(request.cookies),
      requestHeaders: sanitizeRequestHeaders(request.headers),
      supabaseClient: Boolean(supabase),
    });
    console.error("[runSecurityGate] beklenmeyen hata:", error, diagnostics);
    throw error;
  }
}
