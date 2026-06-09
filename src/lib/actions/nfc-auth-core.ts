"use server";

import { randomUUID } from "crypto";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import { nfcCardValidationErrorMessage } from "@/lib/nfc/card-validation-messages";
import {
  DASHBOARD_PATH,
  NFC_CARD_OWNED_BY_OTHER_MESSAGE,
  PROFILE_COMPLETE_PATH,
} from "@/lib/nfc/constants";
import { canBindClaimedCard, claimNfcCard } from "@/lib/nfc/nfc-ownership.server";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";
import { syncAnonymousProfileToUser } from "@/lib/nfc/profile-sync.server";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import {
  getNfcSession,
  setNfcSession,
  validateNfcCardActive,
} from "@/lib/nfc/session.server";
import { generateReferralCode } from "@/lib/referral";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { logNfcEvent } from "@/lib/nfc/error-logger";

type DeviceContext = {
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
};

type EstablishNfcSessionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

function establishFailure(
  debugReason: string,
  step: string,
  error: unknown,
  details?: Record<string, unknown>
): EstablishNfcSessionResult {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : String(error);

  console.error(`[NFC_AUTH_DEBUG]: Hata sebebi ${debugReason}`, {
    step,
    message,
    details: details ?? {},
    error,
  });
  console.error(`[establishNfcSessionForUser] ${step}`, message, details ?? {}, error);
  return { ok: false, error: message };
}

export async function tryResumeNfcSessionForUser(params: {
  uniqueId: string;
  nfcCardUuid: string;
  profileId: string | null;
  userId: string;
  device: DeviceContext;
}): Promise<{ ok: true; redirectTo: string } | { ok: false }> {
  const existing = await getNfcSession();

  if (existing?.nfcId === params.nfcCardUuid) {
    const admin = createServiceRoleClient();
    const { data: profileRow } = await admin
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
    console.error("[tryResumeNfcSessionForUser] pair başarısız", paired.error, {
      uniqueId: params.uniqueId,
      userId: params.userId,
      profileId: params.profileId,
    });
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
    const error = nfcCardValidationErrorMessage(card.reason);
    console.error("[pairNfcCardAndCreateSession] kart doğrulama", error, {
      uniqueId: params.uniqueId,
      reason: card.reason,
    });
    return { success: false, error };
  }

  if (
    card.isClaimed &&
    card.ownerId &&
    !canBindClaimedCard(card.isClaimed, card.ownerId, params.userId)
  ) {
    console.error(
      "[pairNfcCardAndCreateSession] kart sahipliği",
      NFC_CARD_OWNED_BY_OTHER_MESSAGE,
      { uniqueId: params.uniqueId, ownerId: card.ownerId, userId: params.userId }
    );
    return { success: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
  }

  const claimed = await claimNfcCard(params.nfcCardUuid, params.userId);
  if (!claimed.ok) {
    console.error("[pairNfcCardAndCreateSession] claimNfcCard", claimed.error, {
      nfcCardUuid: params.nfcCardUuid,
      userId: params.userId,
    });
    return { success: false, error: claimed.error };
  }

  const synced = await syncAnonymousProfileToUser(params.userId, params.uniqueId);
  if (!synced.ok) {
    console.error("[pairNfcCardAndCreateSession] syncAnonymousProfileToUser", synced.error, {
      uniqueId: params.uniqueId,
      userId: params.userId,
    });
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

  if (!session.ok) {
    return { success: false, error: session.error };
  }

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
}): Promise<EstablishNfcSessionResult> {
  console.log("[NFC_AUTH_DEBUG]: establishNfcSessionForUser başladı", {
    uniqueId: params.uniqueId,
    nfcCardUuid: params.nfcCardUuid,
    profileId: params.profileId,
    userId: params.userId ?? null,
  });

  const admin = createServiceRoleClient();

  let profileId = params.profileId;

  if (!profileId) {
    profileId = randomUUID();
    const referralCode = generateReferralCode();

    const { error: profileError } = await admin.from("profiles").insert({
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

    if (profileError) {
      console.error(
        "[NFC_AUTH_DEBUG]: Hata sebebi profiles.insert — yeni profil satırı oluşturulamadı"
      );
      return establishFailure(
        "profiles.insert — yeni profil satırı oluşturulamadı",
        "profiles.insert",
        profileError,
        { profileId, uniqueId: params.uniqueId, userId: params.userId }
      );
    }

    const { error: cardError } = await admin
      .from(NFC_CARD_TABLE)
      .update({ profile_id: profileId })
      .eq("id", params.nfcCardUuid);

    if (cardError) {
      console.error(
        "[NFC_AUTH_DEBUG]: Hata sebebi nfc_user_data.update.profile_id — karta profil bağlanamadı"
      );
      return establishFailure(
        "nfc_user_data.update.profile_id — karta profil bağlanamadı",
        "nfc_user_data.update.profile_id",
        cardError,
        { nfcCardUuid: params.nfcCardUuid, profileId }
      );
    }
  } else if (params.userId) {
    const { error: linkError } = await admin
      .from("profiles")
      .update({ user_id: params.userId })
      .eq("id", profileId);

    if (linkError) {
      console.error(
        "[NFC_AUTH_DEBUG]: Hata sebebi profiles.update.user_id — profil auth kullanıcısına bağlanamadı"
      );
      return establishFailure(
        "profiles.update.user_id — profil auth kullanıcısına bağlanamadı",
        "profiles.update.user_id",
        linkError,
        { profileId, userId: params.userId }
      );
    }
  }

  if (!profileId) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi profileId eksik — oturum için profil kimliği yok"
    );
    return establishFailure(
      "profileId eksik — oturum için profil kimliği yok",
      "profileId_missing",
      new Error("profileId tanımsız"),
      { uniqueId: params.uniqueId }
    );
  }

  try {
    await setNfcSession({
      profileId,
      nfcCardUuid: params.nfcCardUuid,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi setNfcSession — nfc_sessions insert veya çerez yazımı başarısız"
    );
    return establishFailure(
      "setNfcSession — nfc_sessions insert veya çerez yazımı başarısız",
      "setNfcSession",
      error,
      {
        profileId,
        nfcCardUuid: params.nfcCardUuid,
        uniqueId: params.uniqueId,
      }
    );
  }

  try {
    await confirmStorageAccessAction();
  } catch (error) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi confirmStorageAccessAction — storage çerezi set edilemedi"
    );
    return establishFailure(
      "confirmStorageAccessAction — storage çerezi set edilemedi",
      "confirmStorageAccessAction",
      error,
      { profileId }
    );
  }

  const { data: profileRow, error: nameError } = await admin
    .from("profiles")
    .select("name")
    .eq("id", profileId)
    .maybeSingle();

  if (nameError) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi profiles.select.name — profil doğrulama sorgusu başarısız"
    );
    return establishFailure(
      "profiles.select.name — profil doğrulama sorgusu başarısız",
      "profiles.select.name",
      nameError,
      { profileId }
    );
  }

  return {
    ok: true,
    redirectTo: profileRow?.name?.trim()
      ? DASHBOARD_PATH
      : PROFILE_COMPLETE_PATH,
  };
}
