"use server";

import { requireAdminUser } from "@/lib/admin/admin-auth.server";
import {
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PROFILES_TABLE = "profiles";

export type AdminManagedUser = {
  id: string;
  name: string;
  nfcUid: string | null;
  isActive: boolean;
  cardActive: boolean | null;
};

export type AdminUsersListResult =
  | { ok: true; users: AdminManagedUser[] }
  | { ok: false; error: string };

export type SetAccountActiveResult =
  | { ok: true; isActive: boolean }
  | { ok: false; error: string };

export async function checkIsAdminAction(): Promise<boolean> {
  const admin = await requireAdminUser();
  return admin.ok;
}

export async function listAdminManagedUsersAction(): Promise<AdminUsersListResult> {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    return { ok: false, error: admin.error };
  }

  const supabase = createServiceRoleClient();
  const { data: profiles, error } = await supabase
    .from(PROFILES_TABLE)
    .select("id, name, nfc_uid, is_active")
    .order("name", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  const profileIds = (profiles ?? []).map((row) => row.id);
  const cardActiveByProfile = new Map<string, boolean>();

  if (profileIds.length > 0) {
    const { data: cards } = await supabase
      .from(NFC_CARD_TABLE)
      .select("profile_id, is_active")
      .in("profile_id", profileIds);

    for (const card of cards ?? []) {
      if (card.profile_id) {
        cardActiveByProfile.set(card.profile_id, card.is_active !== false);
      }
    }
  }

  const users: AdminManagedUser[] = (profiles ?? []).map((row) => ({
    id: row.id,
    name: row.name?.trim() || "İsimsiz",
    nfcUid: row.nfc_uid ?? null,
    isActive: row.is_active !== false,
    cardActive: cardActiveByProfile.has(row.id)
      ? cardActiveByProfile.get(row.id)!
      : null,
  }));

  return { ok: true, users };
}

/** Hesap + bağlı NFC kartını tek tıkla aktif/pasif yap */
export async function setAccountActiveStatusAction(
  profileId: string,
  isActive: boolean
): Promise<SetAccountActiveResult> {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    return { ok: false, error: admin.error };
  }

  if (profileId === admin.profileId && !isActive) {
    return { ok: false, error: "Kendi hesabınızı askıya alamazsınız." };
  }

  const supabase = createServiceRoleClient();

  const { error: profileError } = await supabase
    .from(PROFILES_TABLE)
    .update({ is_active: isActive })
    .eq("id", profileId);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  const { error: cardError } = await supabase
    .from(NFC_CARD_TABLE)
    .update({ is_active: isActive })
    .eq("profile_id", profileId);

  if (cardError) {
    return { ok: false, error: cardError.message };
  }

  return { ok: true, isActive };
}
