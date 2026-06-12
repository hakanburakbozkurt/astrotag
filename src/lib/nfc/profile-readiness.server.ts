import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DASHBOARD_PATH,
  PROFILE_SETUP_PATH,
} from "@/lib/nfc/constants";
import {
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

const PLACEHOLDER_BIRTH_DATE = "1970-01-01";
const PLACEHOLDER_BIRTH_TIME = "00:00:00";

export type ProfileGateFields = {
  name: string | null;
  birth_date: string | null;
  is_profile_complete?: boolean | null;
};

/** PIN sonrası yönlendirme — name veya birth_date eksik mi? */
export function isProfileBasicInfoMissing(
  profile: ProfileGateFields
): boolean {
  const name = profile.name?.trim() ?? "";
  const birthDate = profile.birth_date?.trim() ?? "";

  if (!name) {
    return true;
  }

  if (!birthDate || birthDate === PLACEHOLDER_BIRTH_DATE) {
    return true;
  }

  return false;
}

export async function loadProfileGateFields(
  supabase: SupabaseClient,
  profileId: string
): Promise<ProfileGateFields | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, birth_date, is_profile_complete")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * PIN başarılı → profile-setup veya dashboard (yıldız haritası).
 * profiles: is_profile_complete veya name/birth_date eksikliği.
 */
export async function resolveRedirectAfterPinLogin(
  supabase: SupabaseClient,
  profileId: string
): Promise<string> {
  const profile = await loadProfileGateFields(supabase, profileId);

  console.log("[resolveRedirectAfterPinLogin] profiles gate", {
    profileId,
    found: Boolean(profile),
    name: profile?.name ?? null,
    birth_date: profile?.birth_date ?? null,
    is_profile_complete: profile?.is_profile_complete ?? null,
  });

  if (!profile) {
    return PROFILE_SETUP_PATH;
  }

  if (profile.is_profile_complete === true && !isProfileBasicInfoMissing(profile)) {
    return DASHBOARD_PATH;
  }

  return PROFILE_SETUP_PATH;
}

/** @deprecated nfc_user_data kayıt akışı — profiles gate kullan */
export type NfcUserDataRegistrationFields = {
  full_name: string | null;
  birth_date: string | null;
  phone_number?: string | null;
  /** Kart sahibi kaydı tamamlandı mı (is_initialized karşılığı) */
  is_claimed?: boolean | null;
};

export function isNfcUserDataRegistrationComplete(
  data: NfcUserDataRegistrationFields
): boolean {
  if (data.is_claimed !== true) {
    return false;
  }

  const name = data.full_name?.trim() ?? "";
  const birthDate = data.birth_date?.trim() ?? "";
  const phoneNumber = data.phone_number?.trim() ?? "";

  if (!name) {
    return false;
  }

  if (!birthDate || birthDate === PLACEHOLDER_BIRTH_DATE) {
    return false;
  }

  if (!phoneNumber) {
    return false;
  }

  return true;
}

function logRegistrationFieldChecks(
  context: string,
  fields: NfcUserDataRegistrationFields | null,
  extra?: Record<string, unknown>
): void {
  const name = fields?.full_name?.trim() ?? "";
  const birthDate = fields?.birth_date?.trim() ?? "";
  const phoneNumber = fields?.phone_number?.trim() ?? "";

  console.log(`[${context}] nfc_user_data strict check`, {
    rowFound: Boolean(fields),
    is_claimed: fields?.is_claimed ?? null,
    full_name_raw: fields?.full_name ?? null,
    full_name_empty: !name,
    birth_date_raw: fields?.birth_date ?? null,
    birth_date_empty: !birthDate || birthDate === PLACEHOLDER_BIRTH_DATE,
    phone_number_raw: fields?.phone_number ?? null,
    phone_number_empty: !phoneNumber,
    isComplete: fields ? isNfcUserDataRegistrationComplete(fields) : false,
    ...extra,
  });
}

const NFC_USER_DATA_REGISTRATION_SELECT =
  "full_name, birth_date, phone_number, is_claimed" as const;

/** Middleware / dashboard — profiles kurulum tamamlandı mı? */
export async function isProfileReadyForDashboard(
  supabase: SupabaseClient,
  profileId: string
): Promise<boolean> {
  const profile = await loadProfileGateFields(supabase, profileId);

  if (!profile) {
    return false;
  }

  if (profile.is_profile_complete === true && !isProfileBasicInfoMissing(profile)) {
    return true;
  }

  return false;
}

/** nfc_user_data — oturumdaki kart UUID ile (session.nfc_id ile aynı satır) */
export async function loadNfcUserDataRegistrationByCardId(
  supabase: SupabaseClient,
  nfcCardUuid: string
): Promise<
  (NfcUserDataRegistrationFields & { nfc_id: string | null; id: string }) | null
> {
  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select(`id, nfc_id, ${NFC_USER_DATA_REGISTRATION_SELECT}`)
    .eq("id", nfcCardUuid)
    .maybeSingle();

  if (error || !data) {
    logRegistrationFieldChecks("loadNfcUserDataRegistrationByCardId", null, {
      nfcCardUuid,
      dbError: error?.message ?? null,
    });
    return null;
  }

  return data;
}

/** PIN girişi sonrası — slug ile (yedek; birincil kaynak kart UUID) */
export async function loadNfcUserDataRegistrationBySlug(
  supabase: SupabaseClient,
  uniqueId: string
): Promise<NfcUserDataRegistrationFields | null> {
  const normalizedId = normalizeNfcUniqueId(uniqueId);

  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select(NFC_USER_DATA_REGISTRATION_SELECT)
    .eq(NFC_CARD_SLUG_COLUMN, normalizedId)
    .maybeSingle();

  if (error || !data) {
    logRegistrationFieldChecks("loadNfcUserDataRegistrationBySlug", null, {
      uniqueId: normalizedId,
      dbError: error?.message ?? null,
    });
    return null;
  }

  return data;
}

/** Middleware — profile_id ile kayıt tamamlama alanları */
export async function loadNfcUserDataRegistrationByProfileId(
  supabase: SupabaseClient,
  profileId: string
): Promise<NfcUserDataRegistrationFields | null> {
  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select(NFC_USER_DATA_REGISTRATION_SELECT)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

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
  phone_number?: string | null;
};

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
    .select("name, birth_date, birth_time, birth_city, birth_district, phone_number")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
