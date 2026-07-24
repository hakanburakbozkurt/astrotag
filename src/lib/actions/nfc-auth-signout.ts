"use server";

import { endNfcSessionAction } from "@/lib/actions/nfc-auth";
import { clearAuthPendingCookie } from "@/lib/auth/auth-pending-cookie.server";
import { EXPERT_LOGIN_PATH } from "@/lib/expert/expert-paths";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import { readServerCookieSessionAsync } from "@/lib/nfc/cookie-session.server";
import { HOME_PATH, NFC_LOGIN_PATH } from "@/lib/nfc/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export type SignOutResult = {
  redirectTo: string;
};

async function resolvePostSignOutRedirect(profileId: string | null): Promise<string> {
  if (!profileId) {
    return HOME_PATH;
  }

  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("user_role, expert_code, nfc_uid")
    .eq("id", profileId)
    .maybeSingle();

  if (profile?.user_role === "expert" || profile?.expert_code) {
    return EXPERT_LOGIN_PATH;
  }

  const nfcUid = profile?.nfc_uid?.trim();
  if (nfcUid) {
    return `${NFC_LOGIN_PATH}?uid=${encodeURIComponent(nfcUid)}`;
  }

  return HOME_PATH;
}

/** Supabase Auth + NFC oturum çerezlerini temizler; yönlendirme client'ta yapılır */
export async function signOutNfcAction(): Promise<SignOutResult> {
  return withNfcAction("signOutNfcAction", async () => {
    const snapshot = await readServerCookieSessionAsync();
    const redirectTo = await resolvePostSignOutRedirect(snapshot?.profileId ?? null);

    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    await endNfcSessionAction();
    await clearPendingNfcCardCookie();
    await clearAuthPendingCookie();

    return { redirectTo };
  });
}
