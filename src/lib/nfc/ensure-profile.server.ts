import "server-only";

import { randomUUID } from "crypto";
import { logNfcDebug } from "@/lib/nfc/nfc-debug.server";
import { STARTING_STAR_POINTS } from "@/lib/constants/cosmic";
import { generateReferralCode } from "@/lib/referral";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import {
  findProfileIdByNfcUid,
  syncProfileNfcUid,
} from "@/lib/nfc/nfc-profile-link.server";
import {
  NFC_CARD_PROFILE_LINK_SELECT,
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
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
    .from(NFC_CARD_TABLE)
    .select(NFC_CARD_PROFILE_LINK_SELECT)
    .eq(NFC_CARD_SLUG_COLUMN, trimmed)
    .maybeSingle();

  throwIfSupabaseError(cardError, CTX, "nfc_user_data.select", { uniqueId: trimmed });

  if (!card?.id || card.profile_id) {
    return;
  }

  const { error: updateError } = await admin
    .from(NFC_CARD_TABLE)
    .update({ profile_id: profileId })
    .eq("id", card.id);

  throwIfSupabaseError(updateError, CTX, "nfc_user_data.update.profile_id", {
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
  const normalizedSlug = trimmedUniqueId
    ? normalizeNfcUniqueId(trimmedUniqueId)
    : null;

  if (normalizedSlug) {
    const byNfcUid = await findProfileIdByNfcUid(admin, normalizedSlug);

    if (byNfcUid) {
      if (trimmedUniqueId) {
        await linkProfileToNfcCardIfNeeded(byNfcUid, trimmedUniqueId);
      }

      const { error: linkUserError } = await admin
        .from("profiles")
        .update({ user_id: authUserId })
        .eq("id", byNfcUid);

      throwIfSupabaseError(linkUserError, CTX, "profiles.update.user_id", {
        profileId: byNfcUid,
        authUserId,
      });

      logNfcDebug("Profile resolved by nfc_uid", {
        profileId: byNfcUid,
        authUserId,
        nfc_uid: normalizedSlug,
      });

      return { profileId: byNfcUid };
    }
  }

  const { data: existing, error: selectError } = await admin
    .from("profiles")
    .select("id, nfc_uid")
    .eq("user_id", authUserId)
    .maybeSingle();

  throwIfSupabaseError(selectError, CTX, "profiles.select", { authUserId });

  if (existing?.id) {
    if (normalizedSlug) {
      await syncProfileNfcUid(admin, existing.id, normalizedSlug);
    }

    if (trimmedUniqueId) {
      await linkProfileToNfcCardIfNeeded(existing.id, trimmedUniqueId);
    }

    logNfcDebug("Profile already exists", {
      profileId: existing.id,
      authUserId,
    });
    return { profileId: existing.id };
  }

  const profileId = randomUUID();
  const referralCode = generateReferralCode();

  logNfcDebug("Profile insert attempt", {
    authUserId,
    profileId,
    uniqueId: trimmedUniqueId,
    client: "createServiceRoleClient",
  });

  const { error: insertError } = await admin.from("profiles").insert({
    id: profileId,
    user_id: authUserId,
    name: "",
    birth_date: "1970-01-01",
    birth_time: "00:00:00",
    birth_place: "",
    relationship_status: "İlişki Yok",
    star_points: STARTING_STAR_POINTS,
    star_points_bonus: 0,
    referral_code: referralCode,
    nfc_uid: normalizedSlug,
  });

  if (insertError) {
    logNfcDebug("Profile insert failed", {
      authUserId,
      profileId,
      code: insertError.code,
      message: insertError.message,
    });
  } else {
    logNfcDebug("Profile insert success", { authUserId, profileId });
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
