"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HOME_PATH, STORAGE_VERIFIED_COOKIE } from "@/lib/nfc/constants";
import { getStrictCookieOptions, getStrictClearCookieOptions } from "@/lib/nfc/device-cookies.server";
import { getProtectedNfcAccess } from "@/lib/nfc/protected-access.server";
import { clearNfcSessionCookies } from "@/lib/nfc/session.server";

export async function confirmStorageAccessAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STORAGE_VERIFIED_COOKIE, "1", getStrictCookieOptions());
}

export async function checkNfcSessionAction(): Promise<{
  authenticated: boolean;
  profileId: string | null;
  expiresAt: string | null;
}> {
  const access = await getProtectedNfcAccess();

  return {
    authenticated: Boolean(access),
    profileId: access?.profileId ?? null,
    expiresAt: access?.session.expiresAt ?? null,
  };
}

export async function signOutNfcSessionAction(): Promise<void> {
  await endNfcSessionAction();
  redirect(HOME_PATH);
}

export async function endNfcSessionAction(): Promise<void> {
  await clearNfcSessionCookies();

  const cookieStore = await cookies();
  cookieStore.set(STORAGE_VERIFIED_COOKIE, "", getStrictClearCookieOptions());
}
