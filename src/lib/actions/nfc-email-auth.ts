"use server";

import { cookies } from "next/headers";
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
  PENDING_NFC_COOKIE,
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
import {
  resolveNfcCardForAuth,
  type NfcCardAuthEntry,
  type NfcCardAuthLookupFailure,
} from "@/lib/nfc/session.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  authErrorMessage,
  logNfcActionCriticalCatch,
  logNfcAuthSupabaseError,
  logNfcAuthTrace,
} from "@/lib/auth/nfc-auth-debug";
import { logSupabasePublicEnvCheck } from "@/lib/supabase/public-env";
import { authEmailExists } from "@/lib/auth/auth-email-exists.server";
import {
  isUserAlreadyExistsError,
  isUserNotRegisteredError,
} from "@/lib/auth/nfc-auth-errors";
import { authLoginPathClean, nfcAuthSignupPath } from "@/lib/nfc/auth-paths";
import { resolvePostAuthDestination } from "@/lib/nfc/post-auth-redirect.server";
import { ensureProfileForAuthUser } from "@/lib/nfc/ensure-profile.server";
import {
  finishNfcPasswordAuth,
  type NfcAuthDeviceContext,
} from "@/lib/nfc/finish-password-auth.server";
import { logNfcError } from "@/lib/nfc/error-logger";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

type DeviceContext = NfcAuthDeviceContext;

export type NfcAuthActionFailure = {
  success: false;
  error: string;
  redirectPath?: string;
};

export type NfcAuthActionSuccess = {
  success: true;
  redirectTo: string;
  skipOtp?: boolean;
};

function authLookupFailureMessage(
  reason: NfcCardAuthLookupFailure["reason"]
): string {
  return nfcCardValidationErrorMessage(
    reason === "not_found" ? "not_found" : reason === "db_error" ? "db_error" : "config_error"
  );
}

async function loadNfcCardForAuthFlow(
  uniqueId: string
): Promise<
  | { ok: true; card: NfcCardAuthEntry }
  | { ok: false; error: string }
> {
  const card = await resolveNfcCardForAuth(uniqueId);
  if (!card.ok) {
    return { ok: false, error: authLookupFailureMessage(card.reason) };
  }
  return { ok: true, card };
}

async function finishAuthOnlySuccess(
  userId: string,
  uniqueId: string
): Promise<string> {
  await ensureProfileForAuthUser(userId, uniqueId);
  await clearPendingNfcCardCookie();
  await clearAuthPendingCookie();
  return resolvePostAuthDestination(userId);
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
  | { status: "auth_required"; cardInactive?: boolean }
  | { status: "error"; error: string }
> {
  const normalizedId = normalizeNfcUniqueId(uniqueId);
  const handler = "checkNfcAutoLoginAction";

  try {
    return await withNfcAction(handler, async () => {
      const card = await resolveNfcCardForAuth(normalizedId);
      if (!card.ok) {
        return {
          status: "error",
          error: authLookupFailureMessage(card.reason),
        };
      }

      if (!card.isActive) {
        logNfcAuthTrace("Acil auth yolu — kart pasif", {
          handler,
          uniqueId: normalizedId,
        });
        return { status: "auth_required", cardInactive: true };
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
        logNfcActionCriticalCatch(
          `${handler}/tryResumeNfcSessionForUser`,
          resumeError
        );
        logNfcError(
          { layer: "action", handler },
          resumeError,
          { uniqueId: normalizedId, step: "tryResumeNfcSessionForUser" }
        );
        return { status: "auth_required" };
      }
    });
  } catch (error) {
    logNfcActionCriticalCatch(handler, error);
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
 * NFC kayıt: signUp + OTP veya anında oturum + pairing.
 */
export async function startNfcSignupAction(params: {
  email: string;
  password: string;
  confirmPassword: string;
  uniqueId: string;
  device: DeviceContext;
}): Promise<NfcAuthActionSuccess | NfcAuthActionFailure> {
  try {
    return await withNfcAction("startNfcSignupAction", async () => {
      logNfcAuthTrace("Tetiklendi", {
        handler: "startNfcSignupAction",
        uniqueId: params.uniqueId,
      });
      logSupabasePublicEnvCheck("startNfcSignupAction");

      const normalizedEmail = params.email.trim().toLowerCase();

      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { success: false, error: "Geçerli bir e-posta adresi girin." };
      }

      const passwordError = validatePasswordPair(
        params.password,
        params.confirmPassword
      );

      if (passwordError) {
        return { success: false, error: passwordError };
      }

      const loaded = await loadNfcCardForAuthFlow(params.uniqueId);
      if (!loaded.ok) {
        return { success: false, error: loaded.error };
      }

      const { card } = loaded;
      const cardInactive = !card.isActive;

      await setPendingNfcCardCookie(params.uniqueId);

      const supabase = await createServerSupabaseClient();

      logNfcAuthTrace("signUp çağrılıyor", {
        email: normalizedEmail,
        cardInactive,
      });

      const signUp = await supabase.auth.signUp({
        email: normalizedEmail,
        password: params.password,
      });

      if (signUp.error) {
        logNfcAuthSupabaseError("signUp", signUp.error, { email: normalizedEmail });
        logNfcError(
          { layer: "action", handler: "startNfcSignupAction" },
          signUp.error,
          { email: normalizedEmail, step: "signUp" }
        );

        if (isUserAlreadyExistsError(signUp.error)) {
          await setPendingNfcCardCookie(params.uniqueId);
          return {
            success: false,
            error: "Bu e-posta zaten kayıtlı. Giriş sayfasına yönlendiriliyorsunuz.",
            redirectPath: authLoginPathClean({
              email: normalizedEmail,
              msg: "Zaten kayıtlısın, şimdi giriş yap.",
            }),
          };
        }

        return {
          success: false,
          error: authErrorMessage(signUp.error, "Hesap oluşturulamadı."),
        };
      }

      if (signUp.data.user?.id && signUp.data.session) {
        if (cardInactive) {
          return {
            success: true,
            skipOtp: true,
            redirectTo: await finishAuthOnlySuccess(
              signUp.data.user.id,
              params.uniqueId
            ),
          };
        }

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

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${SITE_URL}${AUTH_CALLBACK_PATH}`,
        },
      });

      if (otpError) {
        logNfcAuthSupabaseError("signInWithOtp", otpError, { email: normalizedEmail });

        if (isUserAlreadyExistsError(otpError)) {
          await setPendingNfcCardCookie(params.uniqueId);
          return {
            success: false,
            error: "Bu e-posta zaten kayıtlı. Giriş sayfasına yönlendiriliyorsunuz.",
            redirectPath: authLoginPathClean({
              email: normalizedEmail,
              msg: "Zaten kayıtlısın, şimdi giriş yap.",
            }),
          };
        }

        return {
          success: false,
          error: authErrorMessage(otpError, "Doğrulama kodu gönderilemedi."),
        };
      }

      await setAuthPendingCookie(normalizedEmail, params.uniqueId);

      return {
        success: true,
        redirectTo: buildVerifyOtpUrl(normalizedEmail, params.uniqueId),
      };
    });
  } catch (error) {
    logNfcActionCriticalCatch("startNfcSignupAction/catch", error);
    const detail =
      error instanceof Error
        ? error.message
        : authErrorMessage(error, "Kayıt işlemi başarısız.");
    return { success: false, error: detail };
  }
}

/**
 * NFC giriş: signInWithPassword + pairing.
 */
export async function startNfcLoginAction(params: {
  email: string;
  password: string;
  uniqueId: string;
  device: DeviceContext;
}): Promise<NfcAuthActionSuccess | NfcAuthActionFailure> {
  try {
    return await withNfcAction("startNfcLoginAction", async () => {
      logNfcAuthTrace("Tetiklendi", {
        handler: "startNfcLoginAction",
        uniqueId: params.uniqueId,
      });
      logSupabasePublicEnvCheck("startNfcLoginAction");

      const normalizedEmail = params.email.trim().toLowerCase();

      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { success: false, error: "Geçerli bir e-posta adresi girin." };
      }

      const passwordError = validatePasswordMin(params.password);
      if (passwordError) {
        return { success: false, error: passwordError };
      }

      const loaded = await loadNfcCardForAuthFlow(params.uniqueId);
      if (!loaded.ok) {
        return { success: false, error: loaded.error };
      }

      const { card } = loaded;
      const cardInactive = !card.isActive;

      await setPendingNfcCardCookie(params.uniqueId);

      const supabase = await createServerSupabaseClient();

      const signIn = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: params.password,
      });

      if (signIn.error) {
        logNfcAuthSupabaseError("signInWithPassword", signIn.error, {
          email: normalizedEmail,
        });

        const notRegistered =
          isUserNotRegisteredError(signIn.error) ||
          !(await authEmailExists(normalizedEmail));

        if (notRegistered) {
          return {
            success: false,
            error: "Bu e-posta ile kayıt bulunamadı. Kayıt sayfasına yönlendiriliyorsunuz.",
            redirectPath: nfcAuthSignupPath(params.uniqueId, {
              email: normalizedEmail,
              msg: "Önce hesap oluştur, ardından kartını eşle.",
            }),
          };
        }

        return {
          success: false,
          error: authErrorMessage(
            signIn.error,
            "Giriş başarısız. Şifrenizi kontrol edin."
          ),
        };
      }

      if (!signIn.data.user?.id || !signIn.data.session) {
        return {
          success: false,
          error: "Oturum oluşturulamadı. Lütfen tekrar deneyin.",
        };
      }

      if (cardInactive) {
        return {
          success: true,
          skipOtp: true,
          redirectTo: await finishAuthOnlySuccess(
            signIn.data.user.id,
            params.uniqueId
          ),
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
    });
  } catch (error) {
    logNfcActionCriticalCatch("startNfcLoginAction/catch", error);
    const detail =
      error instanceof Error
        ? error.message
        : authErrorMessage(error, "Giriş işlemi başarısız.");
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

    const loaded = await loadNfcCardForAuthFlow(uniqueId);
    if (!loaded.ok) {
      return { success: false, error: loaded.error };
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

    const loaded = await loadNfcCardForAuthFlow(params.uniqueId);
    if (!loaded.ok) {
      return { success: false, error: loaded.error };
    }

    const { card } = loaded;
    const cardInactive = !card.isActive;

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

    if (cardInactive) {
      return {
        success: true,
        redirectTo: await finishAuthOnlySuccess(
          verifyResult.data.user.id,
          params.uniqueId
        ),
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

/** Giriş sayfası URL'den nfc temizlendikten sonra kart kimliğini çerezden okur */
export async function getPendingNfcIdAction(): Promise<string | null> {
  const cookieStore = await cookies();
  const pending = cookieStore.get(PENDING_NFC_COOKIE)?.value?.trim();

  if (!pending) {
    return null;
  }

  return normalizeNfcUniqueId(pending);
}

/** Giriş sayfasında nfc query çereze yazılır, URL temizlenir */
export async function rememberPendingNfcForAuthAction(
  uniqueId: string
): Promise<void> {
  await setPendingNfcCardCookie(uniqueId);
}
