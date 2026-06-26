"use server";

import { STARTING_STAR_POINTS } from "@/lib/constants/cosmic";
import { DASHBOARD_PATH } from "@/lib/nfc/constants";
import { setProfileReadyCookie } from "@/lib/nfc/cookie-session.server";
import { clearProfileEditModeCookie } from "@/lib/nfc/profile-edit-mode.server";
import { logNfcError } from "@/lib/nfc/error-logger";
import { requireProtectedNfcAccess } from "@/lib/nfc/protected-access.server";
import { loadProfileSetupFields } from "@/lib/nfc/profile-readiness.server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";
import { calculateNatalChart } from "@/lib/astrology/planet-positions";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type ProfileSetupInput = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthDistrict: string;
  phoneNumber?: string;
};

export type ProfileSetupPrefill = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthDistrict: string;
  phoneNumber: string;
};

function normalizeBirthTime(value: string): string {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  return trimmed;
}

/** Oturum açıkken profiles'dan form ön doldurma */
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

    const data = await loadProfileSetupFields(admin, access.profileId);

    if (!data) {
      return null;
    }

    return {
      name: data.name?.trim() ?? "",
      birthDate: data.birth_date?.trim() ?? "",
      birthTime: String(data.birth_time ?? "").slice(0, 5),
      birthCity: data.birth_city?.trim() ?? "",
      birthDistrict: data.birth_district?.trim() ?? "",
      phoneNumber: data.phone_number?.trim() ?? "",
    };
  });
}

export async function saveProfileSetup(
  input: ProfileSetupInput
): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: string }
> {
  return withNfcAction("saveProfileSetup", async () => {
    let access;

    try {
      access = await requireProtectedNfcAccess();
    } catch {
      return {
        success: false,
        error: "Oturum geçersiz. Lütfen kartınızla tekrar giriş yapın.",
      };
    }

    const fullName = input.name.trim();
    const birthCity = input.birthCity.trim();
    const birthDistrict = input.birthDistrict.trim();
    const birthPlace = `${birthCity}, ${birthDistrict}`;
    const birthTime = normalizeBirthTime(input.birthTime);
    const phoneNumber = input.phoneNumber?.trim() ?? "";

    if (
      !fullName ||
      !input.birthDate ||
      !birthTime ||
      !birthCity ||
      !birthDistrict
    ) {
      return { success: false, error: "Zorunlu alanları doldurun." };
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
        name: fullName,
        birth_date: input.birthDate,
        birth_time: birthTime,
        birth_city: birthCity,
        birth_district: birthDistrict,
        birth_place: birthPlace,
        phone_number: phoneNumber || null,
        star_points: STARTING_STAR_POINTS,
        is_profile_complete: true,
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

    try {
      await calculateNatalChart({
        birthDate: input.birthDate,
        birthTime,
        birthPlace,
      });
    } catch (astroError) {
      logNfcError(
        { layer: "action", handler: "saveProfileSetup/calculateNatalChart" },
        astroError,
        { profileId: access.profileId }
      );
    }

    await setProfileReadyCookie(true);
    await clearProfileEditModeCookie();

    return {
      success: true,
      redirectTo: DASHBOARD_PATH,
    };
  });
}
