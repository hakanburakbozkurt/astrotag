"use server";

import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import { logNfcError } from "@/lib/nfc/error-logger";
import { hashAndStorePin } from "@/lib/nfc/nfc-auth-core";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";
import { requireProtectedNfcAccess } from "@/lib/nfc/protected-access.server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type ProfileSetupInput = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthDistrict: string;
  pin: string;
};

export async function saveProfileSetup(
  input: ProfileSetupInput
): Promise<{ success: true } | { success: false; error: string }> {
  return withNfcAction("saveProfileSetup", async () => {
    let access;

    try {
      access = await requireProtectedNfcAccess();
    } catch {
      return { success: false, error: "Oturum geçersiz. Lütfen kartınızla tekrar giriş yapın." };
    }

    const name = input.name.trim();
    const birthCity = input.birthCity.trim();
    const birthDistrict = input.birthDistrict.trim();
    const birthPlace = `${birthCity}, ${birthDistrict}`;

    if (!name || !input.birthDate || !input.birthTime || !birthCity || !birthDistrict) {
      return { success: false, error: "Tüm alanlar zorunludur." };
    }

    let admin;
    try {
      admin = createServiceRoleClient();
    } catch (error) {
      logNfcError({ layer: "action", handler: "saveProfileSetup" }, error);
      return { success: false, error: "Profil kaydedilemedi." };
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        name,
        birth_date: input.birthDate,
        birth_time: input.birthTime,
        birth_city: birthCity,
        birth_district: birthDistrict,
        birth_place: birthPlace,
        cosmic_energy: STARTING_ENERGY,
      })
      .eq("id", access.profileId);

    if (profileError) {
      logNfcError(
        { layer: "action", handler: "saveProfileSetup" },
        profileError,
        { profileId: access.profileId }
      );
      return { success: false, error: "Profil kaydedilemedi." };
    }

    const { error: claimError } = await admin
      .from(NFC_CARD_TABLE)
      .update({ is_claimed: true })
      .eq("id", access.nfcCardUuid)
      .eq("profile_id", access.profileId);

    if (claimError) {
      logNfcError(
        { layer: "action", handler: "saveProfileSetup" },
        claimError,
        { nfcCardUuid: access.nfcCardUuid, profileId: access.profileId }
      );
    }

    const pinResult = await hashAndStorePin(access.nfcCardUuid, input.pin);

    if (!pinResult.ok) {
      return { success: false, error: pinResult.error };
    }

    return { success: true };
  });
}

/** Oturum açıkken yalnızca PIN güncelleme */
export async function updateNfcPin(
  pin: string
): Promise<{ success: true } | { success: false; error: string }> {
  return withNfcAction("updateNfcPin", async () => {
    let access;

    try {
      access = await requireProtectedNfcAccess();
    } catch {
      return { success: false, error: "Oturum geçersiz." };
    }

    const pinResult = await hashAndStorePin(access.nfcCardUuid, pin);

    if (!pinResult.ok) {
      return { success: false, error: pinResult.error };
    }

    return { success: true };
  });
}
