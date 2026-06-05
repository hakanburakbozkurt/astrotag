import "server-only";

import { randomUUID } from "crypto";
import { logNfcAuthTrace } from "@/lib/auth/nfc-auth-debug";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import { generateReferralCode } from "@/lib/referral";
import { throwIfSupabaseError } from "@/lib/nfc/supabase-nfc.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const CTX = { layer: "action" as const, handler: "ensureProfileForAuthUser" };

async function linkProfileToNfcCardIfNeeded(
  profileId: string,
  uniqueId: string
): Promise<void> {
  const admin = createServiceRoleClient();
  const trimmed = uniqueId.trim();

  const { data: card, error: cardError } = await admin
    .from("nfc_cards")
    .select("id, profile_id")
    .eq("unique_id", trimmed)
    .maybeSingle();

  throwIfSupabaseError(cardError, CTX, "nfc_cards.select", { uniqueId: trimmed });

  if (!card?.id || card.profile_id) {
    return;
  }

  const { error: updateError } = await admin
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
 * Tüm profiles erişimi createServiceRoleClient (RLS bypass).
 */
export async function ensureProfileForAuthUser(
  authUserId: string,
  uniqueId?: string
): Promise<{ profileId: string }> {
  const admin = createServiceRoleClient();
  const trimmedUniqueId = uniqueId?.trim() || null;

  const { data: existing, error: selectError } = await admin
    .from("profiles")
    .select("id, nfc_uid")
    .eq("user_id", authUserId)
    .maybeSingle();

  throwIfSupabaseError(selectError, CTX, "profiles.select", { authUserId });

  if (existing?.id) {
    if (trimmedUniqueId && existing.nfc_uid !== trimmedUniqueId) {
      const { error: updateError } = await admin
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

    logNfcAuthTrace("ensureProfileForAuthUser.mevcut", {
      profileId: existing.id,
      authUserId,
    });
    return { profileId: existing.id };
  }

  const profileId = randomUUID();
  const referralCode = generateReferralCode();

  logNfcAuthTrace("ensureProfileForAuthUser.insert.başlıyor", {
    authUserId,
    profileId,
    uniqueId: trimmedUniqueId,
  });

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

  if (insertError) {
    logNfcAuthTrace("ensureProfileForAuthUser.insert.HATA", {
      authUserId,
      profileId,
      code: insertError.code,
      message: insertError.message,
    });
  } else {
    logNfcAuthTrace("ensureProfileForAuthUser.insert.ok", {
      authUserId,
      profileId,
    });
  }

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
