import "server-only";

import { cookies } from "next/headers";
import { NFC_LAST_LOGIN_AT_COOKIE } from "@/lib/nfc/constants";
import { isWithinAuthPersistenceWindow } from "@/lib/nfc/auth-persistence.shared";

export { isWithinAuthPersistenceWindow };

export async function readLastLoginAtCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(NFC_LAST_LOGIN_AT_COOKIE)?.value?.trim() ?? null;
}

export async function setLastLoginAtCookie(expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  const { getStrictCookieOptions } = await import("@/lib/nfc/device-cookies.server");

  cookieStore.set(
    NFC_LAST_LOGIN_AT_COOKIE,
    new Date().toISOString(),
    getStrictCookieOptions(expiresAt)
  );
}
