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

export type ProfileSetupPrefill = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthDistrict: string;
};

function parseBirthLocation(location: string | null | undefined): {
  city: string;
  district: string;
} {
  const trimmed = location?.trim() ?? "";
  if (!trimmed) {
    return { city: "", district: "" };
  }

  const parts = trimmed.split(",").map((part) => part.trim());
  if (parts.length >= 2) {
    return { city: parts[0] ?? "", district: parts.slice(1).join(", ") };
  }

  return { city: trimmed, district: "" };
}

/** Oturum açıkken nfc_user_data'dan form ön doldurma */
export async function loadProfileSetupPrefill(): Promise<
  ProfileSetupPrefill | null
> {
  return withNfcAction("loadProfileSetupPrefill", async () => {
    let access;

    try {
      access = await requireProtectedNfcAccess();
    } catch {
      return null;
    }

    let admin;
    try {
      admin = createServiceRoleClient();
    } catch {
      return null;
    }

    const { data, error } = await admin
      .from(NFC_CARD_TABLE)
      .select("full_name, birth_date, birth_time, birth_location")
      .eq("id", access.nfcCardUuid)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const { city, district } = parseBirthLocation(data.birth_location);

    return {
      name: data.full_name?.trim() ?? "",
      birthDate: data.birth_date?.trim() ?? "",
      birthTime: String(data.birth_time ?? "").slice(0, 5),
      birthCity: city,
      birthDistrict: district,
    };
  });
}

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

    const fullName = input.name.trim();
    const birthCity = input.birthCity.trim();
    const birthDistrict = input.birthDistrict.trim();
    const birthLocation = `${birthCity}, ${birthDistrict}`;
    const birthPlace = birthLocation;

    if (!fullName || !input.birthDate || !input.birthTime || !birthCity || !birthDistrict) {
      return { success: false, error: "Tüm alanlar zorunludur." };
    }

    let admin;
    try {
      admin = createServiceRoleClient();
    } catch (error) {
      logNfcError({ layer: "action", handler: "saveProfileSetup" }, error);
      return { success: false, error: "Profil kaydedilemedi." };
    }

    const { error: cardError } = await admin
      .from(NFC_CARD_TABLE)
      .update({
        full_name: fullName,
        birth_date: input.birthDate,
        birth_time: input.birthTime,
        birth_location: birthLocation,
        is_claimed: true,
      })
      .eq("id", access.nfcCardUuid)
      .eq("profile_id", access.profileId);

    if (cardError) {
      logNfcError(
        { layer: "action", handler: "saveProfileSetup" },
        cardError,
        { nfcCardUuid: access.nfcCardUuid, profileId: access.profileId }
      );
      return { success: false, error: "Profil kaydedilemedi." };
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        name: fullName,
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
