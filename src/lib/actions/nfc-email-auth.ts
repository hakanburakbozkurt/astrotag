"use server";

import {
  clearAuthPendingCookie,
  setAuthPendingCookie,
} from "@/lib/auth/auth-pending-cookie.server";
import {
  normalizeOtpCode,
  validatePasswordMin,
  validatePasswordPair,
} from "@/lib/auth/password-rules";
import {
  pairNfcCardAndCreateSession,
  tryResumeNfcSessionForUser,
} from "@/lib/actions/nfc-auth-core";
import {
  AUTH_CALLBACK_PATH,
  NFC_CARD_OWNED_BY_OTHER_MESSAGE,
  SITE_URL,
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
import {
  authErrorMessage,
  logNfcAuthSupabaseError,
  logNfcAuthTrace,
  logRawAuthErrorDetail,
} from "@/lib/auth/nfc-auth-debug";
import { logSupabasePublicEnvCheck } from "@/lib/supabase/public-env";
import { ensureProfileForAuthUser } from "@/lib/nfc/ensure-profile.server";
import { logNfcError } from "@/lib/nfc/error-logger";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

type DeviceContext = {
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
};

export type NfcEmailAuthMode = "signup" | "login";

type NfcCardReady = {
  nfcId: string;
  profileId: string | null;
  isClaimed: boolean;
  ownerId: string | null;
};

function isUserAlreadyExistsError(error: {
  code?: string;
  message?: string;
}): boolean {
  const code = error.code?.toLowerCase() ?? "";
  const msg = error.message?.toLowerCase() ?? "";

  return (
    code === "user_already_exists" ||
    msg.includes("already") ||
    msg.includes("registered")
  );
}

async function finishNfcPasswordAuth(params: {
  uniqueId: string;
  userId: string;
  card: NfcCardReady;
  device: DeviceContext;
}): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: string }
> {
  const { profileId: ensuredProfileId } = await ensureProfileForAuthUser(
    params.userId,
    params.uniqueId
  );

  const paired = await pairNfcCardAndCreateSession({
    uniqueId: params.uniqueId,
    userId: params.userId,
    nfcCardUuid: params.card.nfcId,
    profileId: params.card.profileId ?? ensuredProfileId,
    device: params.device,
  });

  if (!paired.success) {
    return { success: false, error: paired.error };
  }

  await clearAuthPendingCookie();
  return { success: true, redirectTo: paired.redirectTo };
}

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

      const { profileId: ensuredProfileId } = await ensureProfileForAuthUser(
        user.id,
        normalizedId
      );

      try {
        const resumed = await tryResumeNfcSessionForUser({
          uniqueId: normalizedId,
          nfcCardUuid: card.nfcId,
          profileId: card.profileId ?? ensuredProfileId,
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
  mode: NfcEmailAuthMode;
  device: DeviceContext;
}): Promise<
  | { success: true; redirectTo: string; skipOtp?: boolean }
  | { success: false; error: string; switchToLogin?: boolean }
> {
  try {
    return await withNfcAction("startNfcEmailAuthAction", async () => {
    logNfcAuthTrace("Tetiklendi", {
      handler: "startNfcEmailAuthAction",
      uniqueId: params.uniqueId,
      mode: params.mode,
    });
    logSupabasePublicEnvCheck("startNfcEmailAuthAction");

    const normalizedEmail = params.email.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: "Geçerli bir e-posta adresi girin." };
    }

    const passwordError =
      params.mode === "signup"
        ? validatePasswordPair(params.password, params.confirmPassword)
        : validatePasswordMin(params.password);

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

    if (params.mode === "login") {
      logNfcAuthTrace("signInWithPassword çağrılıyor", {
        email: normalizedEmail,
        mode: "login",
      });

      const signIn = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: params.password,
      });

      if (signIn.error) {
        logNfcAuthSupabaseError("signInWithPassword", signIn.error, {
          email: normalizedEmail,
        });
        return {
          success: false,
          error: authErrorMessage(
            signIn.error,
            "Giriş başarısız. E-posta veya şifreyi kontrol edin."
          ),
        };
      }

      if (!signIn.data.user?.id || !signIn.data.session) {
        return {
          success: false,
          error: "Oturum oluşturulamadı. Lütfen tekrar deneyin.",
        };
      }

      if (
        card.isClaimed &&
        card.ownerId &&
        !canBindClaimedCard(card.isClaimed, card.ownerId, signIn.data.user.id)
      ) {
        await supabase.auth.signOut();
        return { success: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
      }

      const finished = await finishNfcPasswordAuth({
        uniqueId: params.uniqueId,
        userId: signIn.data.user.id,
        card,
        device: params.device,
      });

      if (!finished.success) {
        return finished;
      }

      return {
        success: true,
        skipOtp: true,
        redirectTo: finished.redirectTo,
      };
    }

    logNfcAuthTrace("signUp çağrılıyor", { email: normalizedEmail, mode: "signup" });

    const signUp = await supabase.auth.signUp({
      email: normalizedEmail,
      password: params.password,
    });

    if (signUp.error) {
      logNfcAuthTrace("Hata yakalandı", { step: "signUp", email: normalizedEmail });
      logNfcAuthSupabaseError("signUp", signUp.error, { email: normalizedEmail });
      logNfcError(
        { layer: "action", handler: "startNfcEmailAuthAction" },
        signUp.error,
        { email: normalizedEmail, step: "signUp" }
      );

      if (isUserAlreadyExistsError(signUp.error)) {
        return {
          success: false,
          switchToLogin: true,
          error: "Zaten kayıtlısın, şimdi giriş yapıyorsun.",
        };
      }

      return {
        success: false,
        error: authErrorMessage(signUp.error, "Hesap oluşturulamadı."),
      };
    }

    logNfcAuthTrace("signUp tamam", {
      email: normalizedEmail,
      hasUser: Boolean(signUp.data.user?.id),
      hasSession: Boolean(signUp.data.session),
    });

    if (signUp.data.user?.id && signUp.data.session) {
      if (
        card.isClaimed &&
        card.ownerId &&
        !canBindClaimedCard(card.isClaimed, card.ownerId, signUp.data.user.id)
      ) {
        await supabase.auth.signOut();
        return { success: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
      }

      const finished = await finishNfcPasswordAuth({
        uniqueId: params.uniqueId,
        userId: signUp.data.user.id,
        card,
        device: params.device,
      });

      if (!finished.success) {
        return finished;
      }

      return {
        success: true,
        skipOtp: true,
        redirectTo: finished.redirectTo,
      };
    }

    logNfcAuthTrace("signInWithOtp çağrılıyor", { email: normalizedEmail });

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${SITE_URL}${AUTH_CALLBACK_PATH}`,
      },
    });

    if (otpError) {
      logNfcAuthTrace("Hata yakalandı", {
        step: "signInWithOtp",
        email: normalizedEmail,
      });
      logNfcAuthSupabaseError("signInWithOtp", otpError, {
        email: normalizedEmail,
      });
      logNfcError(
        { layer: "action", handler: "startNfcEmailAuthAction" },
        otpError,
        { email: normalizedEmail, step: "signInWithOtp" }
      );

      if (isUserAlreadyExistsError(otpError)) {
        return {
          success: false,
          switchToLogin: true,
          error: "Zaten kayıtlısın, şimdi giriş yapıyorsun.",
        };
      }

      return {
        success: false,
        error: authErrorMessage(otpError, "Doğrulama kodu gönderilemedi."),
      };
    }

    logNfcAuthTrace("signInWithOtp tamam", { email: normalizedEmail });

    await setAuthPendingCookie(normalizedEmail, params.uniqueId);

    return {
      success: true,
      redirectTo: buildVerifyOtpUrl(normalizedEmail, params.uniqueId),
    };
    });
  } catch (error) {
    logNfcAuthTrace("Hata yakalandı", {
      handler: "startNfcEmailAuthAction",
      layer: "catch",
    });
    logRawAuthErrorDetail(error);
    logNfcAuthSupabaseError("startNfcEmailAuthAction/catch", error, {
      uniqueId: params.uniqueId,
    });
    const detail =
      error instanceof Error
        ? error.message
        : authErrorMessage(error, "Kayıt işlemi başarısız.");
    return { success: false, error: detail };
  }
}

export async function resendNfcOtpAction(
  email: string,
  uniqueId: string
): Promise<{ success: true } | { success: false; error: string }> {
  return withNfcAction("resendNfcOtpAction", async () => {
    logNfcAuthTrace("Tetiklendi", { handler: "resendNfcOtpAction" });

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
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${SITE_URL}${AUTH_CALLBACK_PATH}`,
      },
    });

    if (error) {
      logNfcAuthTrace("Hata yakalandı", { step: "signInWithOtp", email: normalizedEmail });
      logNfcAuthSupabaseError("resendNfcOtpAction/signInWithOtp", error, {
        email: normalizedEmail,
      });
      logNfcError(
        { layer: "action", handler: "resendNfcOtpAction" },
        error,
        { email: normalizedEmail }
      );
      return {
        success: false,
        error: authErrorMessage(error, "Kod tekrar gönderilemedi."),
      };
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

    const { profileId: ensuredProfileId } = await ensureProfileForAuthUser(
      verifyResult.data.user.id,
      params.uniqueId
    );

    const paired = await pairNfcCardAndCreateSession({
      uniqueId: params.uniqueId,
      userId: verifyResult.data.user.id,
      nfcCardUuid: card.nfcId,
      profileId: card.profileId ?? ensuredProfileId,
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
