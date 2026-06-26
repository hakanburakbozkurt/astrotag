"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HOME_PATH, STORAGE_VERIFIED_COOKIE } from "@/lib/nfc/constants";
import {
  clearPendingNfcCardCookie,
  getStrictCookieOptions,
  getStrictClearCookieOptions,
} from "@/lib/nfc/device-cookies.server";
import { readServerCookieSessionAsync } from "@/lib/nfc/cookie-session.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
    const snapshot = await readServerCookieSessionAsync();

    return {
      authenticated: Boolean(snapshot),
      profileId: snapshot?.profileId ?? null,
      expiresAt: snapshot?.expiresAt ?? null,
    };
  });
}

/** Profil tamamlama: NFC oturumu veya yeni kayıt Supabase oturumu */
export async function checkProfilePageAccessAction(): Promise<{
  allowed: boolean;
  viaNfc: boolean;
  viaSupabase: boolean;
}> {
  return withNfcAction("checkProfilePageAccessAction", async () => {
    const snapshot = await readServerCookieSessionAsync();
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const viaNfc = Boolean(snapshot);
    const viaSupabase = Boolean(user?.id);

    return {
      allowed: viaNfc || viaSupabase,
      viaNfc,
      viaSupabase,
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
