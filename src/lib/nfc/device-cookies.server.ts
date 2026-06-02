import "server-only";

import { cookies } from "next/headers";
import { NFC_SESSION_TTL_MINUTES } from "@/lib/nfc/constants";

/** iOS Safari uyumu: HttpOnly + Secure + SameSite=Strict */
export function getStrictCookieOptions(expiresAt?: Date) {
  const expires =
    expiresAt ??
    new Date(Date.now() + NFC_SESSION_TTL_MINUTES * 60 * 1000);

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
