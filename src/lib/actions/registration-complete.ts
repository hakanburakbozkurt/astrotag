"use server";

import { DASHBOARD_PATH } from "@/lib/nfc/constants";
import { logNfcError } from "@/lib/nfc/error-logger";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";
import { requireProtectedNfcAccess } from "@/lib/nfc/protected-access.server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type RegistrationCompleteInput = {
  fullName: string;
  birthDate: string;
  phoneNumber: string;
};

export type RegistrationCompletePrefill = {
  fullName: string;
  birthDate: string;
  phoneNumber: string;
};

export async function loadRegistrationCompletePrefill(): Promise<
  RegistrationCompletePrefill | null
> {
  return withNfcAction("loadRegistrationCompletePrefill", async () => {
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
      .select("full_name, birth_date, phone_number")
      .eq("id", access.nfcCardUuid)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      fullName: data.full_name?.trim() ?? "",
      birthDate: data.birth_date?.trim() ?? "",
      phoneNumber: data.phone_number?.trim() ?? "",
    };
  });
}

export async function saveRegistrationComplete(
  input: RegistrationCompleteInput
): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: string }
> {
  return withNfcAction("saveRegistrationComplete", async () => {
    let access;

    try {
      access = await requireProtectedNfcAccess();
    } catch {
      return {
        success: false,
        error: "Oturum geçersiz. Lütfen kartınızla tekrar giriş yapın.",
      };
    }

    const fullName = input.fullName.trim();
    const birthDate = input.birthDate.trim();
    const phoneNumber = input.phoneNumber.trim();

    if (!fullName || !birthDate || !phoneNumber) {
      return { success: false, error: "Tüm alanlar zorunludur." };
    }

    let admin;
    try {
      admin = createServiceRoleClient();
    } catch (error) {
      logNfcError({ layer: "action", handler: "saveRegistrationComplete" }, error);
      return { success: false, error: "Kayıt güncellenemedi." };
    }

    const { error: cardError } = await admin
      .from(NFC_CARD_TABLE)
      .update({
        full_name: fullName,
        birth_date: birthDate,
        phone_number: phoneNumber,
        is_claimed: true,
      })
      .eq("id", access.nfcCardUuid)
      .eq("profile_id", access.profileId);

    if (cardError) {
      logNfcError(
        { layer: "action", handler: "saveRegistrationComplete" },
        cardError,
        { nfcCardUuid: access.nfcCardUuid, profileId: access.profileId }
      );
      return { success: false, error: "Kayıt güncellenemedi." };
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        name: fullName,
        birth_date: birthDate,
      })
      .eq("id", access.profileId);

    if (profileError) {
      logNfcError(
        { layer: "action", handler: "saveRegistrationComplete/profiles" },
        profileError,
        { profileId: access.profileId }
      );
      return { success: false, error: "Kayıt güncellenemedi." };
    }

    return { success: true, redirectTo: DASHBOARD_PATH };
  });
}
