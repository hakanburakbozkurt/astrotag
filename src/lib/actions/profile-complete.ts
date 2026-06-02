"use server";

import { redirect } from "next/navigation";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import { SESSION_EXPIRED_PATH } from "@/lib/nfc/constants";
import { requireNfcSessionProfileId } from "@/lib/nfc/session.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { UserData } from "@/types/user";

export type CompleteProfileInput = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  relationshipStatus: string;
};

export async function completeUserProfile(
  input: CompleteProfileInput
): Promise<{ success: true; profile: UserData } | { success: false; error: string }> {
  let profileId: string;

  try {
    profileId = await requireNfcSessionProfileId();
  } catch {
    redirect(SESSION_EXPIRED_PATH);
  }

  const name = input.name.trim();
  const birthPlace = input.birthPlace.trim();

  if (!name || !input.birthDate || !input.birthTime || !birthPlace || !input.relationshipStatus) {
    return { success: false, error: "Tüm profil alanları zorunludur." };
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      birth_date: input.birthDate,
      birth_time: input.birthTime,
      birth_place: birthPlace,
      relationship_status: input.relationshipStatus,
    })
    .eq("id", profileId);

  if (error) {
    console.error("PROFILE_COMPLETE_ERROR:", error.message);
    return { success: false, error: "Profil kaydedilemedi." };
  }

  const { data, error: readError } = await supabase
    .from("profiles")
    .select(
      "name, birth_date, birth_time, birth_place, relationship_status, cosmic_energy, energy_bonus, referral_code, partner_name, partner_birth_date, partner_birth_time, partner_birth_place"
    )
    .eq("id", profileId)
    .maybeSingle();

  if (readError || !data?.name) {
    return { success: false, error: "Profil doğrulanamadı." };
  }

  const profile: UserData = {
    name: data.name,
    birthDate: data.birth_date,
    birthTime: data.birth_time,
    birthPlace: data.birth_place ?? "",
    relationshipStatus: data.relationship_status ?? "İlişki Yok",
    cosmicEnergy: data.cosmic_energy ?? STARTING_ENERGY,
    energyBonus: data.energy_bonus ?? 0,
    referralCode: data.referral_code,
    partnerName: data.partner_name,
    partnerBirthDate: data.partner_birth_date ?? undefined,
    partnerBirthTime: data.partner_birth_time ?? undefined,
    partnerBirthPlace: data.partner_birth_place ?? undefined,
  };

  return { success: true, profile };
}
