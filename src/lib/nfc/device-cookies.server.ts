import "server-only";

import { cookies } from "next/headers";
import {
  NFC_SESSION_TTL_DAYS,
  PENDING_NFC_COOKIE,
} from "@/lib/nfc/constants";

/** iOS Safari uyumu: HttpOnly + Secure + SameSite=Strict */
export function getStrictCookieOptions(expiresAt?: Date) {
  const expires =
    expiresAt ??
    new Date(Date.now() + NFC_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires,
  };
}

export function getStrictClearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 0,
  };
}

/** E-posta doğrulama sonrası middleware'in /c/[id]?pair=1'e yönlendirmesi için */
export async function setPendingNfcCardCookie(uniqueId: string): Promise<void> {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  cookieStore.set(PENDING_NFC_COOKIE, uniqueId.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires,
  });
}

export async function clearPendingNfcCardCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_NFC_COOKIE, "", getStrictClearCookieOptions());
}
