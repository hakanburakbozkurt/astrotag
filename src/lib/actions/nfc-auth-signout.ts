"use server";

import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { EXPERT_LOGIN_PATH } from "@/lib/expert/expert-paths";
import { clearAllAuthState } from "@/lib/nfc/clear-all-auth-cookies.server";
import { AUTH_LOGIN_PATH, HOME_PATH } from "@/lib/nfc/constants";
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
    return `${AUTH_LOGIN_PATH}?nfc=${encodeURIComponent(nfcUid)}`;
  }

  return HOME_PATH;
}

/** Supabase Auth oturumunu sonlandır — client hard redirect yapar */
export async function signOutNfcAction(): Promise<SignOutResult> {
  return withNfcAction("signOutNfcAction", async () => {
    const authProfile = await getAuthProfileContext();
    const redirectTo = await resolvePostSignOutRedirect(authProfile?.profileId ?? null);

    const supabase = await createServerSupabaseClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("[signOutNfcAction] supabase.auth.signOut:", signOutError.message);
    }

    await clearAllAuthState();

    return { redirectTo };
  });
}
