import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileSetupFields = {
  name: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_city: string | null;
  birth_district: string | null;
};

const PLACEHOLDER_BIRTH_DATE = "1970-01-01";
const PLACEHOLDER_BIRTH_TIME = "00:00:00";

export function needsProfileSetup(profile: ProfileSetupFields): boolean {
  return !isProfileSetupComplete(profile);
}

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

/** Middleware / gate — profiles satırından tamamlanma durumu */
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
