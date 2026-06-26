import "server-only";

import { cookies } from "next/headers";
import { DASHBOARD_PATH, POST_AUTH_RETURN_TO_COOKIE } from "@/lib/nfc/constants";
import {
  getStrictClearCookieOptions,
  getStrictCookieOptions,
} from "@/lib/nfc/device-cookies.server";

const ALLOWED_RETURN_PREFIXES = [
  "/dashboard",
  "/profile-setup",
  "/profile",
] as const;

export function isSafePostAuthReturnPath(path: string): boolean {
  const normalized = path.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return false;
  }

  return ALLOWED_RETURN_PREFIXES.some(
    (prefix) =>
      normalized === prefix ||
      normalized.startsWith(`${prefix}/`) ||
      normalized.startsWith(`${prefix}?`)
  );
}

export async function setPostAuthReturnToCookie(path: string): Promise<void> {
  if (!isSafePostAuthReturnPath(path)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(
    POST_AUTH_RETURN_TO_COOKIE,
    path,
    getStrictCookieOptions()
  );
}

export async function consumePostAuthReturnToCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const path = cookieStore.get(POST_AUTH_RETURN_TO_COOKIE)?.value?.trim() ?? "";

  cookieStore.set(POST_AUTH_RETURN_TO_COOKIE, "", getStrictClearCookieOptions());

  if (!path || !isSafePostAuthReturnPath(path)) {
    return null;
  }

  return path;
}

export async function clearPostAuthReturnToCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(POST_AUTH_RETURN_TO_COOKIE, "", getStrictClearCookieOptions());
}

/** PIN sonrası tek kural: kayıtlı hedef veya dashboard. Profil durumuna göre zorlama yok. */
export async function resolvePostPinLoginRedirect(): Promise<string> {
  const returnTo = await consumePostAuthReturnToCookie();
  return returnTo ?? DASHBOARD_PATH;
}
