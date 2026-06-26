"use server";

import { clearAuthPendingCookie } from "@/lib/auth/auth-pending-cookie.server";
import { endNfcSessionAction } from "@/lib/actions/nfc-auth";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export async function signOutNfcAction(): Promise<void> {
  return withNfcAction("signOutNfcAction", async () => {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    await endNfcSessionAction();
    await clearPendingNfcCardCookie();
    await clearAuthPendingCookie();
  });
}
