"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HOME_PATH, STORAGE_VERIFIED_COOKIE } from "@/lib/nfc/constants";
import {
  clearPendingNfcCardCookie,
  getStrictCookieOptions,
  getStrictClearCookieOptions,
} from "@/lib/nfc/device-cookies.server";
import { getProtectedNfcAccess } from "@/lib/nfc/protected-access.server";
import { clearNfcSessionCookies } from "@/lib/nfc/session.server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export async function confirmStorageAccessAction(): Promise<void> {
  return withNfcAction("confirmStorageAccessAction", async () => {
    const cookieStore = await cookies();
    cookieStore.set(STORAGE_VERIFIED_COOKIE, "1", getStrictCookieOptions());
  });
}

export async function checkNfcSessionAction(): Promise<{
  authenticated: boolean;
  profileId: string | null;
  expiresAt: string | null;
}> {
  return withNfcAction("checkNfcSessionAction", async () => {
    const access = await getProtectedNfcAccess();

    return {
      authenticated: Boolean(access),
      profileId: access?.profileId ?? null,
      expiresAt: access?.session.expiresAt ?? null,
    };
  });
}

export async function signOutNfcSessionAction(): Promise<void> {
  return withNfcAction("signOutNfcSessionAction", async () => {
    await endNfcSessionAction();
    redirect(HOME_PATH);
  });
}

export async function endNfcSessionAction(): Promise<void> {
  return withNfcAction("endNfcSessionAction", async () => {
    await clearNfcSessionCookies();
    await clearPendingNfcCardCookie();

    const cookieStore = await cookies();
    cookieStore.set(STORAGE_VERIFIED_COOKIE, "", getStrictClearCookieOptions());
  });
}
