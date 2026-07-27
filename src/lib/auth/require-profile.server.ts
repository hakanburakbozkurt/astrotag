import "server-only";

import type { User } from "@supabase/supabase-js";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type AuthProfileContext = {
  authUserId: string;
  profileId: string;
  uniqueId: string | null;
  nfcCardUuid: string | null;
  isGuest: boolean;
};

async function loadProfileForAuthUser(
  user: User
): Promise<AuthProfileContext | null> {
  const admin = createServiceRoleClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, nfc_uid, is_active, is_guest")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile?.id || profile.is_active === false) {
    return null;
  }

  const { data: card } = await admin
    .from(NFC_CARD_TABLE)
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  return {
    authUserId: user.id,
    profileId: profile.id,
    uniqueId: profile.nfc_uid?.trim() || null,
    nfcCardUuid: card?.id ?? null,
    isGuest: profile.is_guest === true,
  };
}

export async function getAuthProfileContext(): Promise<AuthProfileContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return null;
  }

  return loadProfileForAuthUser(user);
}

export async function requireAuthProfileContext(): Promise<AuthProfileContext> {
  const context = await getAuthProfileContext();

  if (!context) {
    throw new Error("Oturum geçersiz veya profil bulunamadı.");
  }

  return context;
}
