"use server";

import { randomUUID } from "crypto";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import {
  NFC_CARD_INACTIVE_MESSAGE,
  NFC_CARD_OWNED_BY_OTHER_MESSAGE,
  PROFILE_COMPLETE_PATH,
} from "@/lib/nfc/constants";
import { canBindClaimedCard, claimNfcCard } from "@/lib/nfc/nfc-ownership.server";
import { syncAnonymousProfileToUser } from "@/lib/nfc/profile-sync.server";
import { hashFingerprintPayload } from "@/lib/nfc/fingerprint.server";
import {
  confirmStorageAccessAction,
  endNfcSessionAction,
} from "@/lib/actions/nfc-auth";
import {
  createEphemeralNfcSession,
  setNfcSessionCookies,
  validateNfcCardActive,
} from "@/lib/nfc/session.server";
import { generateReferralCode } from "@/lib/referral";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { logNfcError, logNfcEvent } from "@/lib/nfc/error-logger";
import { throwIfSupabaseError } from "@/lib/nfc/supabase-nfc.server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export type NfcEntryResolveResult =
  | { status: "logged_in"; redirectTo: string }
  | { status: "pair_required" }
  | { status: "error"; error: string };

/**
 * NFC kartı okutulduğunda: unique_id → nfc_cards → sahip varsa oturum aç.
 */
export async function resolveNfcEntryAction(
  uniqueId: string,
  screenWidth: number,
  screenHeight: number,
  userAgent: string
): Promise<NfcEntryResolveResult> {
  return withNfcAction("resolveNfcEntryAction", async () => {
    logNfcEvent(
      "info",
      { layer: "action", handler: "resolveNfcEntryAction" },
      "NFC giriş çözümlemesi",
      { uniqueId }
    );

    const card = await validateNfcCardActive(uniqueId);
    if (!card.ok) {
      return { status: "error", error: NFC_CARD_INACTIVE_MESSAGE };
    }

    if (card.isClaimed && card.ownerId) {
      const session = await establishNfcSessionForUser({
        uniqueId,
        nfcCardUuid: card.nfcId,
        profileId: card.profileId,
        userId: card.ownerId,
        userAgent,
        screenWidth,
        screenHeight,
      });

      return { status: "logged_in", redirectTo: session.redirectTo };
    }

    return { status: "pair_required" };
  });
}

export async function sendNfcPairingOtpAction(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  return withNfcAction("sendNfcPairingOtpAction", async () => {
    const normalized = email.trim().toLowerCase();

    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { success: false, error: "Geçerli bir e-posta adresi girin." };
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { shouldCreateUser: true },
    });

    if (error) {
      logNfcError(
        { layer: "action", handler: "sendNfcPairingOtpAction" },
        error,
        { email: normalized, supabaseCode: error.code }
      );
      throw error;
    }

    return { success: true };
  });
}

export async function verifyNfcPairingOtpAction(
  email: string,
  otp: string,
  uniqueId: string
): Promise<
  | { success: true; userId: string; email: string }
  | { success: false; error: string }
> {
  return withNfcAction("verifyNfcPairingOtpAction", async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const token = otp.trim();

    if (!normalizedEmail || !token) {
      return { success: false, error: "E-posta ve doğrulama kodu zorunludur." };
    }

    const card = await validateNfcCardActive(uniqueId);
    if (!card.ok) {
      return { success: false, error: NFC_CARD_INACTIVE_MESSAGE };
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: "email",
    });

    if (error) {
      logNfcError(
        { layer: "action", handler: "verifyNfcPairingOtpAction" },
        error,
        { email: normalizedEmail, supabaseCode: error.code }
      );
      throw error;
    }

    if (!data.user?.id) {
      return {
        success: false,
        error: "Doğrulama kodu geçersiz veya süresi dolmuş.",
      };
    }

    if (
      card.isClaimed &&
      card.ownerId &&
      !canBindClaimedCard(card.isClaimed, card.ownerId, data.user.id)
    ) {
      return { success: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
    }

    const synced = await syncAnonymousProfileToUser(data.user.id, uniqueId);
    if (!synced.ok) {
      return { success: false, error: synced.error };
    }

    return {
      success: true,
      userId: data.user.id,
      email: normalizedEmail,
    };
  });
}

export async function completeNfcCardPairingAction(params: {
  uniqueId: string;
  userId: string;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
}): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: string }
> {
  return withNfcAction("completeNfcCardPairingAction", async () => {
    const card = await validateNfcCardActive(params.uniqueId);
    if (!card.ok) {
      return { success: false, error: NFC_CARD_INACTIVE_MESSAGE };
    }

    if (
      card.isClaimed &&
      card.ownerId &&
      !canBindClaimedCard(card.isClaimed, card.ownerId, params.userId)
    ) {
      return { success: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
    }

    const claimed = await claimNfcCard(card.nfcId, params.userId);
    if (!claimed.ok) {
      return { success: false, error: claimed.error };
    }

    await syncAnonymousProfileToUser(params.userId, params.uniqueId);

    const session = await establishNfcSessionForUser({
      uniqueId: params.uniqueId,
      nfcCardUuid: card.nfcId,
      profileId: card.profileId,
      userId: params.userId,
      userAgent: params.userAgent,
      screenWidth: params.screenWidth,
      screenHeight: params.screenHeight,
    });

    return { success: true, redirectTo: session.redirectTo };
  });
}

export async function signOutNfcAction(): Promise<void> {
  return withNfcAction("signOutNfcAction", async () => {
    await endNfcSessionAction();
  });
}

async function establishNfcSessionForUser(params: {
  uniqueId: string;
  nfcCardUuid: string;
  profileId: string | null;
  userId?: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
}): Promise<{ redirectTo: string }> {
  const ctx = { layer: "action" as const, handler: "establishNfcSessionForUser" };
  const service = createSupabaseServiceClient();
  const fingerprint = hashFingerprintPayload(
    params.userAgent,
    params.screenWidth,
    params.screenHeight
  );

  let profileId = params.profileId;

  if (!profileId) {
    profileId = randomUUID();
    const referralCode = generateReferralCode();

    const { error: profileError } = await service.from("profiles").insert({
      id: profileId,
      user_id: params.userId ?? null,
      name: "",
      birth_date: "1970-01-01",
      birth_time: "00:00:00",
      birth_place: "",
      relationship_status: "İlişki Yok",
      cosmic_energy: STARTING_ENERGY,
      energy_bonus: 0,
      referral_code: referralCode,
      nfc_uid: params.uniqueId.trim(),
    });

    throwIfSupabaseError(profileError, ctx, "profiles.insert", {
      profileId,
      uniqueId: params.uniqueId,
    });

    const { error: cardError } = await service
      .from("nfc_cards")
      .update({ profile_id: profileId })
      .eq("id", params.nfcCardUuid);

    throwIfSupabaseError(cardError, ctx, "nfc_cards.update.profile_id", {
      nfcCardUuid: params.nfcCardUuid,
      profileId,
    });
  } else if (params.userId) {
    const { error: linkError } = await service
      .from("profiles")
      .update({ user_id: params.userId })
      .eq("id", profileId);

    throwIfSupabaseError(linkError, ctx, "profiles.update.user_id", {
      profileId,
      userId: params.userId,
    });
  }

  const sessionId = await createEphemeralNfcSession({
    profileId,
    nfcId: params.nfcCardUuid,
    fingerprint,
    userAgent: params.userAgent,
  });

  await setNfcSessionCookies(sessionId, fingerprint);
  await confirmStorageAccessAction();

  const { data: profileRow, error: nameError } = await service
    .from("profiles")
    .select("name")
    .eq("id", profileId)
    .maybeSingle();

  throwIfSupabaseError(nameError, ctx, "profiles.select.name", { profileId });

  const redirectTo = profileRow?.name?.trim()
    ? "/dashboard"
    : PROFILE_COMPLETE_PATH;

  return { redirectTo };
}
