"use server";

import { randomUUID } from "crypto";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import {
  NFC_CARD_INACTIVE_MESSAGE,
  NFC_CARD_OWNED_BY_OTHER_MESSAGE,
  PROFILE_COMPLETE_PATH,
} from "@/lib/nfc/constants";
import {
  assertTrustedDeviceForOwner,
  canBindClaimedCard,
  claimNfcCard,
} from "@/lib/nfc/nfc-ownership.server";
import { syncAnonymousProfileToUser } from "@/lib/nfc/profile-sync.server";
import {
  clearTrustedDeviceCookies,
  getTrustedDeviceFromCookies,
  setTrustedDeviceCookies,
} from "@/lib/nfc/device-cookies.server";
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
import {
  findTrustedDevice,
  getPasskeyForDevice,
  registerTrustedPasskey,
  updatePasskeyCounter,
} from "@/lib/nfc/trusted-devices.server";
import { generateReferralCode } from "@/lib/referral";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  SERVER_BIOMETRIC_FAILED,
  SERVER_BIOMETRIC_UNAVAILABLE,
} from "@/lib/biometric/biometric-labels";
import { logNfcError, logNfcEvent } from "@/lib/nfc/error-logger";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";
import {
  createPasskeyAuthenticationOptions,
  createPasskeyRegistrationOptions,
  verifyPasskeyAuthentication,
  verifyPasskeyRegistration,
} from "@/lib/webauthn/server";

export type NfcEntryResolveResult =
  | { status: "trusted"; redirectTo: string }
  | { status: "bind_required" }
  | { status: "error"; error: string };

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
      "NFC giriş çözümlemesi başladı",
      { uniqueId, screenWidth, screenHeight, userAgent }
    );

    const card = await validateNfcCardActive(uniqueId);
    if (!card.ok) {
      logNfcEvent(
        "warn",
        { layer: "action", handler: "resolveNfcEntryAction" },
        "Kart aktif değil",
        { uniqueId }
      );
      return { status: "error", error: NFC_CARD_INACTIVE_MESSAGE };
    }

    const cookies = await getTrustedDeviceFromCookies();
    const hasTrustedCookies =
      cookies.nfcId === uniqueId.trim() && Boolean(cookies.deviceToken);

    if (card.isClaimed && card.ownerId) {
      if (hasTrustedCookies) {
        const ownerCheck = await assertTrustedDeviceForOwner({
          uniqueId,
          deviceToken: cookies.deviceToken!,
          ownerId: card.ownerId,
        });

        if (!ownerCheck.ok) {
          return { status: "error", error: ownerCheck.error };
        }

        const session = await establishNfcSessionForUser({
          uniqueId,
          nfcCardUuid: card.nfcId,
          profileId: card.profileId,
          deviceToken: cookies.deviceToken!,
          userId: ownerCheck.userId,
          userAgent,
          screenWidth,
          screenHeight,
        });

        if (!session.success) {
          return { status: "error", error: session.error };
        }

        return { status: "trusted", redirectTo: session.redirectTo };
      }

      return { status: "bind_required" };
    }

    if (hasTrustedCookies) {
      const trusted = await findTrustedDevice(uniqueId, cookies.deviceToken!);

      if (trusted) {
        const session = await establishNfcSessionForUser({
          uniqueId,
          nfcCardUuid: card.nfcId,
          profileId: card.profileId,
          deviceToken: cookies.deviceToken!,
          userId: trusted.user_id,
          userAgent,
          screenWidth,
          screenHeight,
        });

        if (!session.success) {
          return { status: "error", error: session.error };
        }

        return { status: "trusted", redirectTo: session.redirectTo };
      }
    }

    return { status: "bind_required" };
  });
}

export async function sendDeviceBindingOtpAction(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  return withNfcAction("sendDeviceBindingOtpAction", async () => {
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
      { layer: "action", handler: "sendDeviceBindingOtpAction" },
      error,
      { email: normalized, supabaseCode: error.code }
    );
    return { success: false, error: "Doğrulama kodu gönderilemedi." };
  }

  return { success: true };
  });
}

export async function verifyDeviceBindingOtpAction(
  email: string,
  otp: string,
  uniqueId: string
): Promise<
  | { success: true; userId: string; email: string }
  | { success: false; error: string }
> {
  return withNfcAction("verifyDeviceBindingOtpAction", async () => {
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

  if (error || !data.user?.id) {
    return { success: false, error: "Doğrulama kodu geçersiz veya süresi dolmuş." };
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

export async function beginPasskeyRegistrationAction(
  uniqueId: string,
  userId: string,
  email: string
): Promise<
  | { success: true; options: PublicKeyCredentialCreationOptionsJSON }
  | { success: false; error: string }
> {
  return withNfcAction("beginPasskeyRegistrationAction", async () => {
  const card = await validateNfcCardActive(uniqueId);
  if (!card.ok) {
    return { success: false, error: NFC_CARD_INACTIVE_MESSAGE };
  }

  try {
    const options = await createPasskeyRegistrationOptions({
      userId,
      email,
      existingCredentials: [],
    });

    return { success: true, options };
  } catch (error) {
    logNfcError(
      { layer: "action", handler: "beginPasskeyRegistrationAction" },
      error,
      { uniqueId, userId, email }
    );
    return {
      success: false,
      error: SERVER_BIOMETRIC_UNAVAILABLE,
    };
  }
  });
}

export async function completeDeviceBindingAction(params: {
  uniqueId: string;
  userId: string;
  registrationResponse: RegistrationResponseJSON;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
}): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: string }
> {
  return withNfcAction("completeDeviceBindingAction", async () => {
  const verification = await verifyPasskeyRegistration({
    response: params.registrationResponse,
  });

  if (!verification.verified || !verification.credential) {
    return {
      success: false,
      error: SERVER_BIOMETRIC_FAILED,
    };
  }

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

  const registered = await registerTrustedPasskey({
    nfcId: params.uniqueId.trim(),
    userId: params.userId,
    credential: verification.credential,
  });

  if (!registered.ok) {
    return { success: false, error: registered.error };
  }

  const claimed = await claimNfcCard(card.nfcId, params.userId);
  if (!claimed.ok) {
    return { success: false, error: claimed.error };
  }

  await syncAnonymousProfileToUser(params.userId, params.uniqueId);

  await setTrustedDeviceCookies(
    params.uniqueId.trim(),
    verification.credential.credentialId
  );

  const session = await establishNfcSessionForUser({
    uniqueId: params.uniqueId,
    nfcCardUuid: card.nfcId,
    profileId: card.profileId,
    deviceToken: verification.credential.credentialId,
    userId: params.userId,
    userAgent: params.userAgent,
    screenWidth: params.screenWidth,
    screenHeight: params.screenHeight,
  });

  if (!session.success) {
    return { success: false, error: session.error };
  }

  return { success: true, redirectTo: session.redirectTo };
  });
}

export async function beginTrustedPasskeyAuthAction(
  uniqueId: string
): Promise<
  | { success: true; options: PublicKeyCredentialRequestOptionsJSON }
  | { success: false; error: string }
> {
  return withNfcAction("beginTrustedPasskeyAuthAction", async () => {
  const cookies = await getTrustedDeviceFromCookies();

  if (cookies.nfcId !== uniqueId.trim() || !cookies.deviceToken) {
    return { success: false, error: "Güvenilir cihaz çerezi bulunamadı." };
  }

  const passkey = await getPasskeyForDevice(uniqueId, cookies.deviceToken);

  if (!passkey) {
    return { success: false, error: "Passkey kaydı bulunamadı." };
  }

  try {
    const options = await createPasskeyAuthenticationOptions({
      credentialId: passkey.credentialId,
      transports: passkey.transports,
    });

    return { success: true, options };
  } catch (error) {
    logNfcError(
      { layer: "action", handler: "beginTrustedPasskeyAuthAction" },
      error,
      { uniqueId }
    );
    return { success: false, error: "Passkey doğrulaması başlatılamadı." };
  }
  });
}

export async function completeTrustedPasskeyAuthAction(params: {
  uniqueId: string;
  authResponse: AuthenticationResponseJSON;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
}): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: string }
> {
  return withNfcAction("completeTrustedPasskeyAuthAction", async () => {
  const cookies = await getTrustedDeviceFromCookies();

  if (!cookies.deviceToken) {
    return { success: false, error: "Cihaz token çerezi eksik." };
  }

  const row = await findTrustedDevice(params.uniqueId, cookies.deviceToken);
  const passkey = await getPasskeyForDevice(params.uniqueId, cookies.deviceToken);

  if (!row || !passkey) {
    return { success: false, error: "Güvenilir cihaz kaydı bulunamadı." };
  }

  const card = await validateNfcCardActive(params.uniqueId);
  if (!card.ok) {
    return { success: false, error: NFC_CARD_INACTIVE_MESSAGE };
  }

  if (card.isClaimed && card.ownerId && row.user_id !== card.ownerId) {
    return { success: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
  }

  const verification = await verifyPasskeyAuthentication({
    response: params.authResponse,
    stored: passkey,
  });

  if (!verification.verified) {
    return { success: false, error: SERVER_BIOMETRIC_FAILED };
  }

  await updatePasskeyCounter(
    params.uniqueId,
    cookies.deviceToken,
    verification.newCounter
  );

  const session = await establishNfcSessionForUser({
    uniqueId: params.uniqueId,
    nfcCardUuid: card.nfcId,
    profileId: card.profileId,
    deviceToken: cookies.deviceToken,
    userId: row.user_id,
    userAgent: params.userAgent,
    screenWidth: params.screenWidth,
    screenHeight: params.screenHeight,
  });

  if (!session.success) {
    return { success: false, error: session.error };
  }

  return { success: true, redirectTo: session.redirectTo };
  });
}

export async function signOutDeviceBoundSessionAction(): Promise<void> {
  return withNfcAction("signOutDeviceBoundSessionAction", async () => {
    await endNfcSessionAction();
    await clearTrustedDeviceCookies();
  });
}

async function establishNfcSessionForUser(params: {
  uniqueId: string;
  nfcCardUuid: string;
  profileId: string | null;
  deviceToken: string;
  userId?: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
}): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: string }
> {
  try {
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

      if (profileError) {
        return { success: false, error: "Profil oluşturulamadı." };
      }

      await service
        .from("nfc_cards")
        .update({ profile_id: profileId })
        .eq("id", params.nfcCardUuid);
    } else if (params.userId) {
      await service
        .from("profiles")
        .update({ user_id: params.userId })
        .eq("id", profileId);
    }

    const sessionId = await createEphemeralNfcSession({
      profileId,
      nfcId: params.nfcCardUuid,
      fingerprint,
      userAgent: params.userAgent,
    });

    await setNfcSessionCookies(sessionId, fingerprint);
    await confirmStorageAccessAction();

    const { data: profileRow } = await service
      .from("profiles")
      .select("name")
      .eq("id", profileId)
      .maybeSingle();

    const redirectTo = profileRow?.name?.trim()
      ? "/dashboard"
      : PROFILE_COMPLETE_PATH;

    return { success: true, redirectTo };
  } catch (error) {
    logNfcError(
      { layer: "action", handler: "establishNfcSessionForUser" },
      error,
      {
        uniqueId: params.uniqueId,
        nfcCardUuid: params.nfcCardUuid,
        profileId: params.profileId,
        userId: params.userId,
      }
    );
    return { success: false, error: "Oturum başlatılamadı." };
  }
}
