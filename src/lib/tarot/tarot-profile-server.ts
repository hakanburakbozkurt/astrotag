import "server-only";

import {
  normalizeDateForInput,
  normalizeTimeForInput,
} from "@/lib/partner-profile";
import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { hasPartnerData, type UserData } from "@/types/user";

const PROFILE_TABLE = "profiles";

export async function getServerUserProfile(
  userId: string
): Promise<UserData | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select(
      "name, birth_date, birth_time, birth_place, relationship_status, cosmic_energy, energy_bonus, referral_code, partner_name, partner_birth_date, partner_birth_time, partner_birth_place"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("TAROT_PROFILE_FETCH_ERROR:", error.message);
    return null;
  }

  if (!data?.name) {
    return null;
  }

  return {
    name: data.name,
    birthDate: data.birth_date,
    birthTime: data.birth_time,
    birthPlace: data.birth_place ?? "",
    relationshipStatus: data.relationship_status ?? "İlişki Yok",
    cosmicEnergy: data.cosmic_energy ?? 0,
    energyBonus: data.energy_bonus ?? 0,
    referralCode: data.referral_code,
    partnerName: data.partner_name,
    partnerBirthDate: normalizeDateForInput(data.partner_birth_date),
    partnerBirthTime: normalizeTimeForInput(data.partner_birth_time),
    partnerBirthPlace: data.partner_birth_place,
  };
}

export function formatUserDataForPrompt(profile: UserData): string {
  return [
    `İsim: ${profile.name}`,
    `Doğum tarihi: ${profile.birthDate}`,
    `Doğum saati: ${profile.birthTime}`,
    `Doğum yeri: ${profile.birthPlace}`,
    `İlişki durumu: ${profile.relationshipStatus}`,
  ].join("; ");
}

export function formatPartnerDataForPrompt(profile: UserData): string {
  if (!hasPartnerData(profile)) {
    return "Partner kaydı yok";
  }

  return [
    `İsim: ${profile.partnerName}`,
    `Doğum tarihi: ${profile.partnerBirthDate}`,
    `Doğum saati: ${profile.partnerBirthTime}`,
    `Doğum yeri: ${profile.partnerBirthPlace}`,
  ].join("; ");
}
