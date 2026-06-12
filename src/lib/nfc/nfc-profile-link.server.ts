import "server-only";

import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { STARTING_STAR_POINTS } from "@/lib/constants/cosmic";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { generateReferralCode } from "@/lib/referral";

const CTX = { layer: "action" as const, handler: "resolveProfileForNfcCard" };

/** profiles.nfc_uid ile kayıtlı profil (kart tanındı) */
export async function findProfileIdByNfcUid(
  supabase: SupabaseClient,
  slug: string
): Promise<string | null> {
  const normalized = normalizeNfcUniqueId(slug);

  if (!normalized) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("nfc_uid", normalized)
    .maybeSingle();

  if (error) {
    logNfcEvent("warn", CTX, "profiles.nfc_uid sorgusu başarısız", {
      nfc_uid: normalized,
      code: error.code,
      message: error.message,
    });
    return null;
  }

  return data?.id?.trim() ?? null;
}

async function loadCardProfileId(
  supabase: SupabaseClient,
  nfcCardUuid: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select("profile_id")
    .eq("id", nfcCardUuid)
    .maybeSingle();

  if (error || !data?.profile_id) {
    return null;
  }

  return data.profile_id.trim() || null;
}

async function linkNfcCardToProfile(
  supabase: SupabaseClient,
  nfcCardUuid: string,
  profileId: string
): Promise<void> {
  const { error } = await supabase
    .from(NFC_CARD_TABLE)
    .update({ profile_id: profileId })
    .eq("id", nfcCardUuid);

  if (error) {
    logNfcEvent("warn", CTX, "nfc_user_data.profile_id bağlanamadı", {
      nfcCardUuid,
      profileId,
      code: error.code,
      message: error.message,
    });
  }
}

/**
 * Oturum/kart profilinde nfc_uid boşsa slug ile güncelle (INSERT yok).
 * Başka bir profilde aynı nfc_uid varsa dokunma.
 */
export async function syncProfileNfcUid(
  supabase: SupabaseClient,
  profileId: string,
  slug: string
): Promise<void> {
  const normalized = normalizeNfcUniqueId(slug);
  const trimmedProfileId = profileId?.trim() ?? "";

  if (!trimmedProfileId || !normalized) {
    return;
  }

  const ownerByUid = await findProfileIdByNfcUid(supabase, normalized);

  if (ownerByUid && ownerByUid !== trimmedProfileId) {
    logNfcEvent("info", CTX, "nfc_uid zaten başka profile bağlı — UPDATE atlandı", {
      profileId: trimmedProfileId,
      ownerProfileId: ownerByUid,
      nfc_uid: normalized,
    });
    return;
  }

  const { data: current, error: readError } = await supabase
    .from("profiles")
    .select("nfc_uid")
    .eq("id", trimmedProfileId)
    .maybeSingle();

  if (readError || !current) {
    return;
  }

  const existingUid = current.nfc_uid?.trim() ?? "";

  if (existingUid === normalized) {
    return;
  }

  if (existingUid) {
    logNfcEvent("info", CTX, "Profilin farklı nfc_uid değeri var — güncellenmedi", {
      profileId: trimmedProfileId,
      existingUid,
      requestedUid: normalized,
    });
    return;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ nfc_uid: normalized })
    .eq("id", trimmedProfileId);

  if (updateError) {
    logNfcEvent("warn", CTX, "profiles.nfc_uid güncellenemedi", {
      profileId: trimmedProfileId,
      nfc_uid: normalized,
      code: updateError.code,
      message: updateError.message,
    });
    return;
  }

  console.log("[syncProfileNfcUid] profiles.nfc_uid güncellendi", {
    profileId: trimmedProfileId,
    nfc_uid: normalized,
  });
}

export async function createProfileForNfcCard(
  supabase: SupabaseClient,
  nfcCardUuid: string,
  slug: string
): Promise<string | null> {
  const profileId = randomUUID();
  const referralCode = generateReferralCode();

  const { error: insertError } = await supabase.from("profiles").insert({
    id: profileId,
    name: "",
    birth_date: "1970-01-01",
    birth_time: "00:00:00",
    birth_place: "",
    birth_city: "",
    birth_district: "",
    relationship_status: "İlişki Yok",
    star_points: STARTING_STAR_POINTS,
    star_points_bonus: 0,
    referral_code: referralCode,
    nfc_uid: slug,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      const existing = await findProfileIdByNfcUid(supabase, slug);
      if (existing) {
        await linkNfcCardToProfile(supabase, nfcCardUuid, existing);
        return existing;
      }
    }

    logNfcEvent("error", CTX, "Yeni profil oluşturulamadı", {
      nfcCardUuid,
      nfc_uid: slug,
      code: insertError.code,
      message: insertError.message,
    });
    return null;
  }

  await linkNfcCardToProfile(supabase, nfcCardUuid, profileId);

  console.log("[resolveProfileForNfcCard] Yeni profil + nfc_uid oluşturuldu", {
    profileId,
    nfc_uid: slug,
    nfcCardUuid,
  });

  return profileId;
}

/**
 * NFC kartı için profil çözümle:
 * 1. nfc_uid ile tanınan profil → kartı bağla
 * 2. Kartın profile_id'si → nfc_uid UPDATE (INSERT yok)
 * 3. Yoksa tek profil INSERT (nfc_uid dolu)
 */
export async function resolveProfileForNfcCard(
  supabase: SupabaseClient,
  params: {
    nfcCardUuid: string;
    slug: string;
    cardProfileId?: string | null;
  }
): Promise<string | null> {
  const slug = normalizeNfcUniqueId(params.slug);
  const nfcCardUuid = params.nfcCardUuid.trim();

  if (!slug || !nfcCardUuid) {
    return null;
  }

  const byUid = await findProfileIdByNfcUid(supabase, slug);

  if (byUid) {
    console.log("[resolveProfileForNfcCard] Kart tanındı — nfc_uid eşleşmesi", {
      nfc_uid: slug,
      profileId: byUid,
      nfcCardUuid,
    });
    await linkNfcCardToProfile(supabase, nfcCardUuid, byUid);
    return byUid;
  }

  const linkedProfileId =
    params.cardProfileId?.trim() ||
    (await loadCardProfileId(supabase, nfcCardUuid));

  if (linkedProfileId) {
    console.log("[resolveProfileForNfcCard] Kart profile_id — nfc_uid sync", {
      profileId: linkedProfileId,
      nfc_uid: slug,
      nfcCardUuid,
    });
    await syncProfileNfcUid(supabase, linkedProfileId, slug);
    return linkedProfileId;
  }

  return createProfileForNfcCard(supabase, nfcCardUuid, slug);
}
