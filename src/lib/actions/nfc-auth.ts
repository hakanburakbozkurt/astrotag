"use server";

import { cookies } from "next/headers";
import { signOutNfcAction, type SignOutResult } from "@/lib/actions/nfc-auth-signout";
import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { clearAllAuthState } from "@/lib/nfc/clear-all-auth-cookies.server";
import { getStrictCookieOptions } from "@/lib/nfc/device-cookies.server";
import { STORAGE_VERIFIED_COOKIE } from "@/lib/nfc/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
    const authProfile = await getAuthProfileContext();

    return {
      authenticated: Boolean(authProfile),
      profileId: authProfile?.profileId ?? null,
      expiresAt: null,
    };
  });
}

/** Profil tamamlama: Supabase oturumu zorunlu */
export async function checkProfilePageAccessAction(): Promise<{
  allowed: boolean;
  viaNfc: boolean;
  viaSupabase: boolean;
}> {
  return withNfcAction("checkProfilePageAccessAction", async () => {
    const authProfile = await getAuthProfileContext();

    return {
      allowed: Boolean(authProfile),
      viaNfc: false,
      viaSupabase: Boolean(authProfile),
    };
  });
}

export async function signOutNfcSessionAction(): Promise<SignOutResult> {
  return signOutNfcAction();
}

export async function endNfcSessionAction(): Promise<void> {
  return withNfcAction("endNfcSessionAction", async () => {
    await clearAllAuthState();
  });
}
