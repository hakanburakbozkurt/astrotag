"use server";

import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PROFILES_TABLE = "profiles";

export type FreezeSelfAccountResult =
  | { ok: true }
  | { ok: false; error: string };

/** Kullanıcının kendi hesabını dondurması — GDPR onay akışından sonra çağrılır */
export async function freezeSelfAccountAction(): Promise<FreezeSelfAccountResult> {
  const auth = await getAuthProfileContext();
  if (!auth) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const supabase = createServiceRoleClient();

  const { error: profileError } = await supabase
    .from(PROFILES_TABLE)
    .update({ is_active: false })
    .eq("id", auth.profileId);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  const { error: cardError } = await supabase
    .from(NFC_CARD_TABLE)
    .update({ is_active: false })
    .eq("profile_id", auth.profileId);

  if (cardError) {
    return { ok: false, error: cardError.message };
  }

  return { ok: true };
}
