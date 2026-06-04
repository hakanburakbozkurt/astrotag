"use server";

import {
  clearAuthPendingCookie,
  setAuthPendingCookie,
} from "@/lib/auth/auth-pending-cookie.server";
import {
  normalizeOtpCode,
  validatePasswordPair,
} from "@/lib/auth/password-rules";
import {
  pairNfcCardAndCreateSession,
  tryResumeNfcSessionForUser,
} from "@/lib/actions/nfc-auth-core";
import {
  NFC_CARD_OWNED_BY_OTHER_MESSAGE,
  VERIFY_OTP_PATH,
} from "@/lib/nfc/constants";
import { cardEntryPathForUniqueId } from "@/lib/nfc/card-paths";
import {
  clearPendingNfcCardCookie,
  setPendingNfcCardCookie,
} from "@/lib/nfc/device-cookies.server";
import { canBindClaimedCard } from "@/lib/nfc/nfc-ownership.server";
import { nfcCardValidationErrorMessage } from "@/lib/nfc/card-validation-messages";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { validateNfcCardActive } from "@/lib/nfc/session.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logNfcError } from "@/lib/nfc/error-logger";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

type DeviceContext = {
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
};

function buildVerifyOtpUrl(email: string, uniqueId: string): string {
  const params = new URLSearchParams({
    email: email.trim().toLowerCase(),
    nfc: uniqueId.trim(),
  });
  return `${VERIFY_OTP_PATH}?${params.toString()}`;
}

/**
 * NFC + Supabase oturumu varsa doğrudan panele yönlendir.
 */
export async function checkNfcAutoLoginAction(
  uniqueId: string,
  device: DeviceContext
): Promise<
  | { status: "logged_in"; redirectTo: string }
  | { status: "auth_required" }
  | { status: "error"; error: string }
> {
  const normalizedId = normalizeNfcUniqueId(uniqueId);
  const handler = "checkNfcAutoLoginAction";

  try {
    return await withNfcAction(handler, async () => {
      const card = await validateNfcCardActive(normalizedId);
      if (!card.ok) {
        return {
          status: "error",
          error: nfcCardValidationErrorMessage(card.reason),
        };
      }

      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        logNfcError(
          { layer: "action", handler },
          userError,
          { uniqueId: normalizedId, step: "auth.getUser" }
        );
        return { status: "auth_required" };
      }

      if (!user?.id) {
        return { status: "auth_required" };
      }

      if (
        card.isClaimed &&
        card.ownerId &&
        !canBindClaimedCard(card.isClaimed, card.ownerId, user.id)
      ) {
        return { status: "error", error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
      }

      try {
        const resumed = await tryResumeNfcSessionForUser({
          uniqueId: normalizedId,
          nfcCardUuid: card.nfcId,
          profileId: card.profileId,
          userId: user.id,
          device,
        });

        if (!resumed.ok) {
          return { status: "auth_required" };
        }

        await clearPendingNfcCardCookie();
        await clearAuthPendingCookie();

        return { status: "logged_in", redirectTo: resumed.redirectTo };
      } catch (resumeError) {
        logNfcError(
          { layer: "action", handler },
          resumeError,
          { uniqueId: normalizedId, step: "tryResumeNfcSessionForUser" }
        );
        return { status: "auth_required" };
      }
    });
  } catch (error) {
    logNfcError({ layer: "action", handler }, error, { uniqueId: normalizedId });
    const detail =
      error instanceof Error ? error.message : "Bilinmeyen sunucu hatası";
    return {
      status: "error",
      error:
        process.env.NODE_ENV === "development"
          ? `Bağlantı kurulamadı: ${detail}`
          : "Bağlantı kurulamadı. Lütfen tekrar deneyin.",
    };
  }
}

/**
 * Kayıt / giriş: şifre ile oturum veya 6 haneli OTP gönderimi.
 */
export async function startNfcEmailAuthAction(params: {
  email: string;
  password: string;
  confirmPassword: string;
  uniqueId: string;
  device: DeviceContext;
}): Promise<
  | { success: true; redirectTo: string; skipOtp?: boolean }
  | { success: false; error: string }
> {
  return withNfcAction("startNfcEmailAuthAction", async () => {
    const normalizedEmail = params.email.trim().toLowerCase();
    const passwordError = validatePasswordPair(
      params.password,
      params.confirmPassword
    );

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: "Geçerli bir e-posta adresi girin." };
    }

    if (passwordError) {
      return { success: false, error: passwordError };
    }

    const card = await validateNfcCardActive(params.uniqueId);
    if (!card.ok) {
      return {
        success: false,
        error: nfcCardValidationErrorMessage(card.reason),
      };
    }

    await setPendingNfcCardCookie(params.uniqueId);

    const supabase = await createServerSupabaseClient();

    const signIn = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: params.password,
    });

    if (signIn.data.user?.id && signIn.data.session) {
      if (
        card.isClaimed &&
        card.ownerId &&
        !canBindClaimedCard(card.isClaimed, card.ownerId, signIn.data.user.id)
      ) {
        await supabase.auth.signOut();
        return { success: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
      }

      const paired = await pairNfcCardAndCreateSession({
        uniqueId: params.uniqueId,
        userId: signIn.data.user.id,
        nfcCardUuid: card.nfcId,
        profileId: card.profileId,
        device: params.device,
      });

      if (!paired.success) {
        return { success: false, error: paired.error };
      }

      await clearAuthPendingCookie();
      return {
        success: true,
        skipOtp: true,
        redirectTo: paired.redirectTo,
      };
    }

    const signUp = await supabase.auth.signUp({
      email: normalizedEmail,
      password: params.password,
    });

    if (signUp.error) {
      const msg = signUp.error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        return {
          success: false,
          error: "Bu e-posta kayıtlı. Şifrenizi kontrol edin veya sıfırlayın.",
        };
      }

      logNfcError(
        { layer: "action", handler: "startNfcEmailAuthAction" },
        signUp.error,
        { email: normalizedEmail }
      );
      return { success: false, error: "Hesap oluşturulamadı." };
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      logNfcError(
        { layer: "action", handler: "startNfcEmailAuthAction" },
        otpError,
        { email: normalizedEmail, step: "signInWithOtp" }
      );
      return { success: false, error: "Doğrulama kodu gönderilemedi." };
    }

    await setAuthPendingCookie(normalizedEmail, params.uniqueId);

    return {
      success: true,
      redirectTo: buildVerifyOtpUrl(normalizedEmail, params.uniqueId),
    };
  });
}

export async function resendNfcOtpAction(
  email: string,
  uniqueId: string
): Promise<{ success: true } | { success: false; error: string }> {
  return withNfcAction("resendNfcOtpAction", async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return { success: false, error: "E-posta adresi gerekli." };
    }

    const card = await validateNfcCardActive(uniqueId);
    if (!card.ok) {
      return {
        success: false,
        error: nfcCardValidationErrorMessage(card.reason),
      };
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false },
    });

    if (error) {
      logNfcError(
        { layer: "action", handler: "resendNfcOtpAction" },
        error,
        { email: normalizedEmail }
      );
      return { success: false, error: "Kod tekrar gönderilemedi." };
    }

    await setAuthPendingCookie(normalizedEmail, uniqueId);
    return { success: true };
  });
}

export async function verifyNfcOtpAndEnterAction(params: {
  email: string;
  otp: string;
  uniqueId: string;
  device: DeviceContext;
}): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: string }
> {
  return withNfcAction("verifyNfcOtpAndEnterAction", async () => {
    const normalizedEmail = params.email.trim().toLowerCase();
    const token = normalizeOtpCode(params.otp);

    if (!normalizedEmail || token.length !== 6) {
      return { success: false, error: "6 haneli kodu eksiksiz girin." };
    }

    const card = await validateNfcCardActive(params.uniqueId);
    if (!card.ok) {
      return {
        success: false,
        error: nfcCardValidationErrorMessage(card.reason),
      };
    }

    await setPendingNfcCardCookie(params.uniqueId);

    const supabase = await createServerSupabaseClient();

    let verifyResult = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: "email",
    });

    if (verifyResult.error) {
      verifyResult = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: "signup",
      });
    }

    if (verifyResult.error || !verifyResult.data.user?.id) {
      logNfcError(
        { layer: "action", handler: "verifyNfcOtpAndEnterAction" },
        verifyResult.error ?? new Error("verifyOtp: user yok"),
        { email: normalizedEmail }
      );
      return {
        success: false,
        error: "Doğrulama kodu geçersiz veya süresi dolmuş.",
      };
    }

    if (
      card.isClaimed &&
      card.ownerId &&
      !canBindClaimedCard(
        card.isClaimed,
        card.ownerId,
        verifyResult.data.user.id
      )
    ) {
      return { success: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
    }

    const paired = await pairNfcCardAndCreateSession({
      uniqueId: params.uniqueId,
      userId: verifyResult.data.user.id,
      nfcCardUuid: card.nfcId,
      profileId: card.profileId,
      device: params.device,
    });

    if (!paired.success) {
      return { success: false, error: paired.error };
    }

    await clearAuthPendingCookie();
    return { success: true, redirectTo: paired.redirectTo };
  });
}

export async function getNfcAuthBackPath(uniqueId: string): Promise<string> {
  return cardEntryPathForUniqueId(uniqueId);
}
