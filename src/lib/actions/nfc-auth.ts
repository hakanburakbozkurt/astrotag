"use server";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import {
  NFC_CARD_INACTIVE_MESSAGE,
  NFC_FINGERPRINT_MISMATCH_MESSAGE,
  NFC_SESSION_TTL_MINUTES,
  PROFILE_COMPLETE_PATH,
  STORAGE_VERIFIED_COOKIE,
} from "@/lib/nfc/constants";
import {
  assertNfcFingerprintMatch,
  clearNfcSessionCookies,
  createEphemeralNfcSession,
  getNfcSession,
  setNfcSessionCookies,
  validateNfcCardActive,
} from "@/lib/nfc/session.server";
import { isValidFingerprintHash } from "@/lib/nfc/fingerprint.server";
import { generateReferralCode } from "@/lib/referral";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type NfcEntryResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

export async function confirmStorageAccessAction(): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + NFC_SESSION_TTL_MINUTES);

  cookieStore.set(STORAGE_VERIFIED_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function checkNfcSessionAction(): Promise<{
  authenticated: boolean;
  profileId: string | null;
  expiresAt: string | null;
}> {
  const session = await getNfcSession();

  return {
    authenticated: Boolean(session),
    profileId: session?.profileId ?? null,
    expiresAt: session?.expiresAt ?? null,
  };
}

export async function initiateZeroClickSession(
  uniqueId: string,
  fingerprint: string,
  userAgent: string
): Promise<NfcEntryResult> {
  if (!uniqueId?.trim() || !isValidFingerprintHash(fingerprint)) {
    return { success: false, error: NFC_FINGERPRINT_MISMATCH_MESSAGE };
  }

  try {
    const card = await validateNfcCardActive(uniqueId);
    if (!card.ok) {
      return { success: false, error: NFC_CARD_INACTIVE_MESSAGE };
    }

    const fingerprintCheck = await assertNfcFingerprintMatch(
      card.nfcId,
      fingerprint.trim()
    );

    if (!fingerprintCheck.ok) {
      return { success: false, error: NFC_FINGERPRINT_MISMATCH_MESSAGE };
    }

    const service = createSupabaseServiceClient();
    let profileId = card.profileId;

    if (!profileId) {
      profileId = randomUUID();
      const referralCode = generateReferralCode();

      const { error: profileError } = await service.from("profiles").insert({
        id: profileId,
        name: "",
        birth_date: "1970-01-01",
        birth_time: "00:00:00",
        birth_place: "",
        relationship_status: "İlişki Yok",
        cosmic_energy: STARTING_ENERGY,
        energy_bonus: 0,
        referral_code: referralCode,
        nfc_uid: uniqueId.trim(),
      });

      if (profileError) {
        console.error("PROFILE_STUB_ERROR:", profileError.message);
        return { success: false, error: NFC_FINGERPRINT_MISMATCH_MESSAGE };
      }

      await service
        .from("nfc_cards")
        .update({ profile_id: profileId })
        .eq("id", card.nfcId);
    }

    const sessionId = await createEphemeralNfcSession({
      profileId,
      nfcId: card.nfcId,
      fingerprint: fingerprint.trim(),
      userAgent,
    });

    await setNfcSessionCookies(sessionId, fingerprint.trim());
    await confirmStorageAccessAction();

    const { data: profileRow } = await service
      .from("profiles")
      .select("name")
      .eq("id", profileId)
      .maybeSingle();

    const redirectTo =
      profileRow?.name?.trim() ? "/dashboard" : PROFILE_COMPLETE_PATH;

    return { success: true, redirectTo };
  } catch (error) {
    console.error("ZERO_CLICK_SESSION_ERROR:", error);
    return { success: false, error: NFC_FINGERPRINT_MISMATCH_MESSAGE };
  }
}

export async function signOutNfcSessionAction(): Promise<void> {
  await clearNfcSessionCookies();

  const cookieStore = await cookies();
  cookieStore.set(STORAGE_VERIFIED_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  redirect("/");
}
