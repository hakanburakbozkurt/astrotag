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
  NFC_CARD_COOKIE,
  NFC_LOGIN_PATH,
  NFC_PROFILE_COOKIE,
  NFC_PROFILE_READY_COOKIE,
  NFC_SESSION_COOKIE,
  NFC_SESSION_EXPIRES_COOKIE,
  PENDING_NFC_COOKIE,
  PRIVATE_MODE_PATH,
  PROFILE_COMPLETE_PATH,
  PROFILE_SETUP_PATH,
  REGISTRATION_COMPLETE_PATH,
  SESSION_EXPIRED_PATH,
  PUBLIC_PATHS,
  PUBLIC_PROFILE_PREFIX,
  STORAGE_VERIFIED_COOKIE,
} from "@/lib/nfc/constants";
import { readCookieSessionSnapshot } from "@/lib/nfc/cookie-session.shared";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import {
  isNfcSessionExpired,
} from "@/lib/nfc/nfc-session-activity.server";
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
    /** NFC kart URL slug — yalnızca /at_xxx rotalarında dolu */
    resolvedUniqueId: string | null;
    /** profiles.id — nfc_sessions.profile_id veya astrotag_nfc_profile çerezi */
    resolvedProfileId: string | null;
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
  const profileCookieId =
    request.cookies.get(NFC_PROFILE_COOKIE)?.value?.trim() ?? "";

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
      resolvedProfileId: profileCookieId || null,
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
  return buildGateDiagnostics(request, supabase);
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
  | "session_idle_expired"
  | "smart_session_resume"
  | "invalid_card_route"
  | "unauthorized_route"
  | "profile_incomplete";

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
    pathname === PROFILE_SETUP_PATH ||
    pathname === REGISTRATION_COMPLETE_PATH ||
    pathname.startsWith("/api/ai")
  );
}

/** /c/, /p/, /{at_xxx} — oturum gerekmez; redirect döngüsünü önlemek için bypass */
function isNfcCardRouteBypass(pathname: string): boolean {
  if (isNfcCardRoutePath(pathname) || isLegacyCardEntryPrefix(pathname)) {
    return true;
  }

  const lower = pathname.toLowerCase();

  /** astrotag.app/at_xxx kök kart girişi — session zorunlu değil */
  if (lower.startsWith("/at_")) {
    return true;
  }

  return isRootCardEntryPath(pathname);
}

/** /c/, /p/ ve /{unique_id} — kart rotası tanıma */
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

const COOKIE_SESSION_NAMES = {
  session: NFC_SESSION_COOKIE,
  profile: NFC_PROFILE_COOKIE,
  card: NFC_CARD_COOKIE,
  expires: NFC_SESSION_EXPIRES_COOKIE,
  profileReady: NFC_PROFILE_READY_COOKIE,
} as const;

/** Middleware hızlı yolu — oturum çerezleri; DB sorgusu yok. */
function validateSessionFromCookies(request: NextRequest):
  | {
      ok: true;
      profileId: string;
      sessionId: string;
    }
  | { ok: false; reason: "session_missing" | "session_expired" } {
  const snapshot = readCookieSessionSnapshot(
    request.cookies,
    COOKIE_SESSION_NAMES
  );

  if (!snapshot) {
    const expiresRaw =
      request.cookies.get(NFC_SESSION_EXPIRES_COOKIE)?.value?.trim() ?? "";
    if (expiresRaw && isNfcSessionExpired(expiresRaw)) {
      return { ok: false, reason: "session_expired" };
    }
    return { ok: false, reason: "session_missing" };
  }

  return {
    ok: true,
    profileId: snapshot.profileId,
    sessionId: snapshot.sessionId,
  };
}

/**
 * Korunan rotalar: yalnızca NFC oturum çerezi (session token) doğrulaması.
 */
export async function runSecurityGate(
  request: NextRequest,
  supabase: SupabaseClient | null
): Promise<SecurityGateResult> {
  const { pathname } = request.nextUrl;
  const sessionId =
    request.cookies.get(NFC_SESSION_COOKIE)?.value?.trim() ?? "";

  if (isNfcCardRouteBypass(pathname)) {
    return { allowed: true };
  }

  const diagnostics = logGateEntry(request, supabase);

  try {
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

    /** /kayit-tamamla — yalnızca PIN oturumu (pending NFC çerezi yetmez) */
    if (pathname === REGISTRATION_COMPLETE_PATH) {
      if (!sessionId) {
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
          "/kayit-tamamla — NFC oturumu yok (PIN girişi gerekli)"
        );
        return deny;
      }
    }

    if (pathname === PROFILE_COMPLETE_PATH || pathname === PROFILE_SETUP_PATH) {
      const pendingNfc = request.cookies.get(PENDING_NFC_COOKIE)?.value?.trim();
      if (pendingNfc) {
        return { allowed: true };
      }
    }

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

    const sessionCheck = validateSessionFromCookies(request);

    if (sessionCheck.ok) {
      diagnostics.checks.resolvedProfileId = sessionCheck.profileId;
    }

    if (!sessionCheck.ok) {
      const redirectTo =
        sessionCheck.reason === "session_expired"
          ? NFC_LOGIN_PATH
          : sessionMissingRedirect(request);
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
        `validateSessionFromCookies → ${sessionCheck.reason}`,
        {
          sessionId,
          sessionCheckReason: sessionCheck.reason,
          pendingNfc: request.cookies.get(PENDING_NFC_COOKIE)?.value ?? null,
        }
      );
      return deny;
    }

    /** Oturum doğrulandı — profil durumundan bağımsız geçiş (tek kural: oturum varsa izin ver) */
    if (pathname === REGISTRATION_COMPLETE_PATH) {
      return { allowed: true };
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
    throw error;
  }
}
