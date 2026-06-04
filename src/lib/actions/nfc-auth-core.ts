"use server";

import { randomUUID } from "crypto";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import {
  DASHBOARD_PATH,
  NFC_CARD_INACTIVE_MESSAGE,
  NFC_CARD_OWNED_BY_OTHER_MESSAGE,
  PROFILE_COMPLETE_PATH,
} from "@/lib/nfc/constants";
import { canBindClaimedCard, claimNfcCard } from "@/lib/nfc/nfc-ownership.server";
import { syncAnonymousProfileToUser } from "@/lib/nfc/profile-sync.server";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import { hashFingerprintPayload } from "@/lib/nfc/fingerprint.server";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import {
  getNfcSession,
  setNfcSession,
  validateNfcCardActive,
} from "@/lib/nfc/session.server";
import { generateReferralCode } from "@/lib/referral";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { throwIfSupabaseError } from "@/lib/nfc/supabase-nfc.server";
import { logNfcEvent } from "@/lib/nfc/error-logger";

type DeviceContext = {
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
};

export async function tryResumeNfcSessionForUser(params: {
  uniqueId: string;
  nfcCardUuid: string;
  profileId: string | null;
  userId: string;
  device: DeviceContext;
}): Promise<{ ok: true; redirectTo: string } | { ok: false }> {
  const existing = await getNfcSession();

  if (existing?.nfcId === params.nfcCardUuid) {
    const service = createSupabaseServiceClient();
    const { data: profileRow } = await service
      .from("profiles")
      .select("name")
      .eq("id", existing.profileId)
      .maybeSingle();

    const redirectTo = profileRow?.name?.trim()
      ? DASHBOARD_PATH
      : PROFILE_COMPLETE_PATH;

    return { ok: true, redirectTo };
  }

  const paired = await pairNfcCardAndCreateSession({
    uniqueId: params.uniqueId,
    userId: params.userId,
    nfcCardUuid: params.nfcCardUuid,
    profileId: params.profileId,
    device: params.device,
  });

  if (!paired.success) {
    return { ok: false };
  }

  return { ok: true, redirectTo: paired.redirectTo };
}

export async function pairNfcCardAndCreateSession(params: {
  uniqueId: string;
  userId: string;
  nfcCardUuid: string;
  profileId: string | null;
  device: DeviceContext;
}): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: string }
> {
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

  const claimed = await claimNfcCard(params.nfcCardUuid, params.userId);
  if (!claimed.ok) {
    return { success: false, error: claimed.error };
  }

  const synced = await syncAnonymousProfileToUser(params.userId, params.uniqueId);
  if (!synced.ok) {
    return { success: false, error: synced.error };
  }

  const session = await establishNfcSessionForUser({
    uniqueId: params.uniqueId,
    nfcCardUuid: params.nfcCardUuid,
    profileId: synced.profileId ?? params.profileId,
    userId: params.userId,
    userAgent: params.device.userAgent,
    screenWidth: params.device.screenWidth,
    screenHeight: params.device.screenHeight,
  });

  await clearPendingNfcCardCookie();

  logNfcEvent(
    "info",
    { layer: "action", handler: "pairNfcCardAndCreateSession" },
    "NFC oturumu + Supabase auth tamamlandı",
    { uniqueId: params.uniqueId, redirectTo: session.redirectTo }
  );

  return { success: true, redirectTo: session.redirectTo };
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

  await setNfcSession({
    profileId,
    nfcCardUuid: params.nfcCardUuid,
    fingerprint,
    userAgent: params.userAgent,
  });

  await confirmStorageAccessAction();

  const { data: profileRow, error: nameError } = await service
    .from("profiles")
    .select("name")
    .eq("id", profileId)
    .maybeSingle();

  throwIfSupabaseError(nameError, ctx, "profiles.select.name", { profileId });

  return {
    redirectTo: profileRow?.name?.trim()
      ? DASHBOARD_PATH
      : PROFILE_COMPLETE_PATH,
  };
}
