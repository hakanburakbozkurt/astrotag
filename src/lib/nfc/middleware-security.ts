import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { isAuthFormPath, isPublicAppPath, normalizeAuthPathname } from "@/lib/nfc/auth-paths";
import {
  extractRootUniqueId,
  isRootCardEntryPath,
} from "@/lib/nfc/card-paths";
import { EXPERT_AUTH_CALLBACK_PATH } from "@/lib/expert/expert-paths";
import {
  AUTH_CALLBACK_PATH,
  AUTH_LOGIN_PATH,
  CARD_ENTRY_PREFIX,
  DASHBOARD_PATH,
  HOME_PATH,
  NFC_LOGIN_PATH,
  PRIVATE_MODE_PATH,
  PROFILE_COMPLETE_PATH,
  PROFILE_SETUP_PATH,
  PUBLIC_PATHS,
  PUBLIC_PROFILE_PREFIX,
  REGISTRATION_COMPLETE_PATH,
  STORAGE_VERIFIED_COOKIE,
} from "@/lib/nfc/constants";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

export type SecurityDenyReason =
  | "private_mode"
  | "session_missing"
  | "unauthorized_route";

export type SecurityGateResult =
  | { allowed: true }
  | { allowed: false; reason: SecurityDenyReason; redirectTo: string };

function isLegacyCardEntryPrefix(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return (
    normalized === CARD_ENTRY_PREFIX ||
    normalized.startsWith(`${CARD_ENTRY_PREFIX}/`)
  );
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
    pathname.startsWith(`${AUTH_CALLBACK_PATH}/`) ||
    pathname === EXPERT_AUTH_CALLBACK_PATH ||
    pathname.startsWith(`${EXPERT_AUTH_CALLBACK_PATH}/`)
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
    isLegacyCardEntryPrefix(pathname) ||
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

/** NFC etiket rotaları — oturum kontrolü yapılmaz (sayfa kendi yönlendirmesini yapar) */
function isNfcShortcutRoute(pathname: string): boolean {
  const normalized = normalizeAuthPathname(pathname);

  if (normalized === NFC_LOGIN_PATH) {
    return true;
  }

  if (
    pathname === "/nfc/enter" ||
    pathname.startsWith("/nfc/enter") ||
    pathname === "/nfc/suspended" ||
    pathname.startsWith("/nfc/suspended")
  ) {
    return true;
  }

  if (
    isLegacyCardEntryPrefix(pathname) ||
    isPublicProfilePath(pathname) ||
    isRootCardEntryPath(pathname)
  ) {
    return true;
  }

  return pathname.toLowerCase().startsWith("/at_");
}

export function shouldRedirectUnknownToHome(pathname: string): boolean {
  if (pathname === HOME_PATH) {
    return false;
  }

  if (isLegacyCardEntryPrefix(pathname)) {
    return false;
  }

  if (isNfcShortcutRoute(pathname) || isAuthFormPath(pathname) || isWarningPath(pathname)) {
    return false;
  }

  if (isPublicAppPath(pathname)) {
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

/**
 * Korunan rotalar: Supabase Auth oturumu (JWT + refresh) zorunlu.
 */
export async function runSecurityGate(
  request: NextRequest,
  authUser: User | null
): Promise<SecurityGateResult> {
  const { pathname } = request.nextUrl;

  if (isNfcShortcutRoute(pathname)) {
    return { allowed: true };
  }

  if (isAuthCallbackPath(pathname)) {
    return { allowed: true };
  }

  if (isAuthFormPath(pathname) || isPublicAppPath(pathname)) {
    return { allowed: true };
  }

  if (shouldRedirectUnknownToHome(pathname)) {
    return {
      allowed: false,
      reason: "unauthorized_route",
      redirectTo: HOME_PATH,
    };
  }

  if (!isProtectedPath(pathname)) {
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

  if (!authUser?.id) {
    const rootNfcId = extractRootUniqueId(pathname);
    const redirectTo = rootNfcId
      ? `${AUTH_LOGIN_PATH}?nfc=${encodeURIComponent(normalizeNfcUniqueId(rootNfcId))}`
      : AUTH_LOGIN_PATH;

    return {
      allowed: false,
      reason: "session_missing",
      redirectTo,
    };
  }

  return { allowed: true };
}
