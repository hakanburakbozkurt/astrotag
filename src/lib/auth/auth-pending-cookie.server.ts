import "server-only";

import { cookies } from "next/headers";
import { getStrictClearCookieOptions } from "@/lib/nfc/device-cookies.server";

export const AUTH_PENDING_COOKIE = "astrotag_auth_pending";

type PendingPayload = {
  email: string;
  nfcId: string;
};

export async function setAuthPendingCookie(
  email: string,
  uniqueId: string
): Promise<void> {
  const cookieStore = await cookies();
  const payload: PendingPayload = {
    email: email.trim().toLowerCase(),
    nfcId: uniqueId.trim(),
  };

  cookieStore.set(AUTH_PENDING_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60,
  });
}

export async function getAuthPendingCookie(): Promise<PendingPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_PENDING_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PendingPayload;
    if (!parsed.email || !parsed.nfcId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearAuthPendingCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_PENDING_COOKIE, "", getStrictClearCookieOptions());
}
