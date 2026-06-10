import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";

/** nfc_user_data — kart profil tamamlama alanları */
export type NfcCardProfileFields = {
  full_name: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_location: string | null;
};

/** profiles — dashboard / astro hesapları (nfc_user_data ile senkron) */
export type ProfileSetupFields = {
  name: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_city: string | null;
  birth_district: string | null;
};

const PLACEHOLDER_BIRTH_DATE = "1970-01-01";
const PLACEHOLDER_BIRTH_TIME = "00:00:00";

export function needsNfcCardProfileSetup(card: NfcCardProfileFields): boolean {
  return !isNfcCardProfileComplete(card);
}

export function isNfcCardProfileComplete(card: NfcCardProfileFields): boolean {
  const name = card.full_name?.trim() ?? "";
  const birthDate = card.birth_date?.trim() ?? "";
  const birthTime = String(card.birth_time ?? "").trim();
  const location = card.birth_location?.trim() ?? "";

  if (!name) {
    return false;
  }

  if (!birthDate || birthDate === PLACEHOLDER_BIRTH_DATE) {
    return false;
  }

  if (!birthTime || birthTime.startsWith("00:00:00")) {
    return false;
  }

  return Boolean(location);
}

/** @deprecated isNfcCardProfileComplete kullan */
export function needsProfileSetup(profile: ProfileSetupFields): boolean {
  return !isProfileSetupComplete(profile);
}

/** @deprecated isNfcCardProfileComplete kullan */
export function isProfileSetupComplete(profile: ProfileSetupFields): boolean {
  const name = profile.name?.trim() ?? "";
  const birthDate = profile.birth_date?.trim() ?? "";
  const birthTime = String(profile.birth_time ?? "").trim();
  const city = profile.birth_city?.trim() ?? "";
  const district = profile.birth_district?.trim() ?? "";

  if (!name) {
    return false;
  }

  if (!birthDate || birthDate === PLACEHOLDER_BIRTH_DATE) {
    return false;
  }

  if (!birthTime || birthTime.startsWith("00:00:00")) {
    return false;
  }

  return Boolean(city && district);
}

export async function loadNfcCardProfileFieldsByCardId(
  supabase: SupabaseClient,
  nfcCardUuid: string
): Promise<NfcCardProfileFields | null> {
  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select("full_name, birth_date, birth_time, birth_location")
    .eq("id", nfcCardUuid)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/** Middleware — oturum profile_id ile kart profil alanlarını okur */
export async function loadNfcCardProfileFieldsByProfileId(
  supabase: SupabaseClient,
  profileId: string
): Promise<NfcCardProfileFields | null> {
  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select("full_name, birth_date, birth_time, birth_location")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/** @deprecated loadNfcCardProfileFieldsByProfileId kullan */
export async function loadProfileSetupFields(
  supabase: SupabaseClient,
  profileId: string
): Promise<ProfileSetupFields | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, birth_date, birth_time, birth_city, birth_district")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
