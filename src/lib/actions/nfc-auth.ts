"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import {
  NFC_AUTH_ERROR_MESSAGE,
  NFC_CARD_ALREADY_USED_MESSAGE,
} from "@/lib/nfc/constants";
import { hashNfcPayload } from "@/lib/nfc/hash.server";
import {
  clearNfcSessionCookie,
  createNfcSessionRecord,
  getNfcSessionProfileId,
  setNfcSessionCookie,
} from "@/lib/nfc/session.server";
import { generateReferralCode } from "@/lib/referral";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type NfcAuthResult =
  | { success: true }
  | { success: false; error: string };

export async function checkNfcSessionAction(): Promise<{
  authenticated: boolean;
  profileId: string | null;
}> {
  const profileId = await getNfcSessionProfileId();
  return {
    authenticated: Boolean(profileId),
    profileId,
  };
}

export async function authenticateNfcCard(
  rawPayload: string
): Promise<NfcAuthResult> {
  if (!rawPayload?.trim()) {
    return { success: false, error: NFC_AUTH_ERROR_MESSAGE };
  }

  try {
    const keyHash = hashNfcPayload(rawPayload);
    const supabase = createSupabaseServiceClient();

    // SELECT * FROM nfc_authorized_keys WHERE key_hash = $1
    const { data: keyRow, error: keyError } = await supabase
      .from("nfc_authorized_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .maybeSingle();

    if (keyError) {
      console.error("NFC_KEY_LOOKUP_ERROR:", keyError.message);
      return { success: false, error: NFC_AUTH_ERROR_MESSAGE };
    }

    if (!keyRow) {
      return { success: false, error: NFC_AUTH_ERROR_MESSAGE };
    }

    if (keyRow.is_used === true) {
      return { success: false, error: NFC_CARD_ALREADY_USED_MESSAGE };
    }

    if (keyRow.is_used !== false) {
      return { success: false, error: NFC_AUTH_ERROR_MESSAGE };
    }

    const profileId = randomUUID();
    const referralCode = generateReferralCode();

    const { error: profileError } = await supabase.from("profiles").insert({
      id: profileId,
      name: "",
      birth_date: "1970-01-01",
      birth_time: "00:00:00",
      birth_place: "",
      relationship_status: "İlişki Yok",
      cosmic_energy: STARTING_ENERGY,
      energy_bonus: 0,
      referral_code: referralCode,
      nfc_uid: null,
    });

    if (profileError) {
      console.error("NFC_PROFILE_STUB_ERROR:", profileError.message);
      return { success: false, error: NFC_AUTH_ERROR_MESSAGE };
    }

    const { data: updatedKeys, error: keyUpdateError } = await supabase
      .from("nfc_authorized_keys")
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        profile_id: profileId,
      })
      .eq("id", keyRow.id)
      .eq("is_used", false)
      .select("id");

    if (keyUpdateError) {
      console.error("NFC_KEY_UPDATE_ERROR:", keyUpdateError.message);
      await supabase.from("profiles").delete().eq("id", profileId);
      return { success: false, error: NFC_AUTH_ERROR_MESSAGE };
    }

    if (!updatedKeys?.length) {
      await supabase.from("profiles").delete().eq("id", profileId);
      return { success: false, error: NFC_CARD_ALREADY_USED_MESSAGE };
    }

    const sessionId = await createNfcSessionRecord(profileId, keyRow.id);
    await setNfcSessionCookie(sessionId);

    return { success: true };
  } catch (error) {
    console.error("NFC_AUTH_ERROR:", error);
    return { success: false, error: NFC_AUTH_ERROR_MESSAGE };
  }
}

export async function signOutNfcSessionAction(): Promise<void> {
  await clearNfcSessionCookie();
  redirect("/");
}
