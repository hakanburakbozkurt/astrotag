import "server-only";

import { randomUUID } from "crypto";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import { generateReferralCode } from "@/lib/referral";
import { throwIfSupabaseError } from "@/lib/nfc/supabase-nfc.server";
import {
  createServiceRoleClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";

const CTX = { layer: "action" as const, handler: "ensureProfileForAuthUser" };

async function linkProfileToNfcCardIfNeeded(
  profileId: string,
  uniqueId: string
): Promise<void> {
  const service = createSupabaseServiceClient();
  const trimmed = uniqueId.trim();

  const { data: card, error: cardError } = await service
    .from("nfc_cards")
    .select("id, profile_id")
    .eq("unique_id", trimmed)
    .maybeSingle();

  throwIfSupabaseError(cardError, CTX, "nfc_cards.select", { uniqueId: trimmed });

  if (!card?.id || card.profile_id) {
    return;
  }

  const { error: updateError } = await service
    .from("nfc_cards")
    .update({ profile_id: profileId })
    .eq("id", card.id);

  throwIfSupabaseError(updateError, CTX, "nfc_cards.update.profile_id", {
    nfcCardUuid: card.id,
    profileId,
  });
}

/**
 * Auth kullanıcısı için profiles satırı yoksa oluşturur; varsa profileId döner.
 */
export async function ensureProfileForAuthUser(
  authUserId: string,
  uniqueId?: string
): Promise<{ profileId: string }> {
  const service = createSupabaseServiceClient();
  const trimmedUniqueId = uniqueId?.trim() || null;

  const { data: existing, error: selectError } = await service
    .from("profiles")
    .select("id, nfc_uid")
    .eq("user_id", authUserId)
    .maybeSingle();

  throwIfSupabaseError(selectError, CTX, "profiles.select", { authUserId });

  if (existing?.id) {
    if (trimmedUniqueId && existing.nfc_uid !== trimmedUniqueId) {
      const { error: updateError } = await service
        .from("profiles")
        .update({ nfc_uid: trimmedUniqueId })
        .eq("id", existing.id);

      throwIfSupabaseError(updateError, CTX, "profiles.update.nfc_uid", {
        profileId: existing.id,
        uniqueId: trimmedUniqueId,
      });
    }

    if (trimmedUniqueId) {
      await linkProfileToNfcCardIfNeeded(existing.id, trimmedUniqueId);
    }

    return { profileId: existing.id };
  }

  const profileId = randomUUID();
  const referralCode = generateReferralCode();

  // Kayıt sırasında oturum henüz RLS için hazır olmayabilir — yalnızca INSERT admin ile
  const admin = createServiceRoleClient();
  const { error: insertError } = await admin.from("profiles").insert({
    id: profileId,
    user_id: authUserId,
    name: "",
    birth_date: "1970-01-01",
    birth_time: "00:00:00",
    birth_place: "",
    relationship_status: "İlişki Yok",
    cosmic_energy: STARTING_ENERGY,
    energy_bonus: 0,
    referral_code: referralCode,
    nfc_uid: trimmedUniqueId,
  });

  throwIfSupabaseError(insertError, CTX, "profiles.insert", {
    profileId,
    authUserId,
    uniqueId: trimmedUniqueId,
  });

  if (trimmedUniqueId) {
    await linkProfileToNfcCardIfNeeded(profileId, trimmedUniqueId);
  }

  return { profileId };
}
