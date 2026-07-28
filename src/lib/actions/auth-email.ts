"use server";

import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import {
  normalizeOtpCode,
  validatePasswordMin,
  validatePasswordPair,
} from "@/lib/auth/password-rules";
import {
  clearAuthPendingCookie,
  setAuthPendingCookie,
} from "@/lib/auth/auth-pending-cookie.server";
import { authEmailExists } from "@/lib/auth/auth-email-exists.server";
import {
  isUserAlreadyExistsError,
  isUserNotRegisteredError,
} from "@/lib/auth/nfc-auth-errors";
import {
  authErrorMessage,
  logNfcActionCriticalCatch,
} from "@/lib/auth/nfc-auth-debug";
import {
  AUTH_CALLBACK_PATH,
  AUTH_SIGNUP_PATH,
  SITE_URL,
  VERIFY_OTP_PATH,
} from "@/lib/nfc/constants";
import { authLoginPathClean, authSignupPathClean } from "@/lib/nfc/auth-paths";
import { canBindClaimedCard } from "@/lib/nfc/nfc-ownership.server";
import { resolvePostAuthDestination } from "@/lib/nfc/post-auth-redirect.server";
import { ensureProfileForAuthUser } from "@/lib/nfc/ensure-profile.server";
import {
  finishNfcPasswordAuth,
  type NfcAuthDeviceContext,
} from "@/lib/nfc/finish-password-auth.server";
import {
  resolveNfcCardForAuth,
  type NfcCardAuthEntry,
} from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";
import { clearPendingNfcCardCookie, setPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";

export type AuthEmailActionFailure = {
  success: false;
  error: string;
  redirectPath?: string;
};

export type AuthEmailActionSuccess = {
  success: true;
  redirectTo: string;
  skipOtp?: boolean;
};

type DeviceContext = NfcAuthDeviceContext;

function buildVerifyOtpUrl(email: string, uniqueId?: string): string {
  const params = new URLSearchParams({
    email: email.trim().toLowerCase(),
  });

  const normalized = uniqueId?.trim();
  if (normalized) {
    params.set("nfc", normalizeNfcUniqueId(normalized));
  }

  return `${VERIFY_OTP_PATH}?${params.toString()}`;
}

async function loadOptionalNfcCard(uniqueId?: string): Promise<
  | { ok: true; card: NfcCardAuthEntry }
  | { ok: false; error: string }
  | { ok: true; card: null }
> {
  const trimmed = uniqueId?.trim();
  if (!trimmed) {
    return { ok: true, card: null };
  }

  const card = await resolveNfcCardForAuth(trimmed);
  if (!card.ok) {
    return { ok: false, error: "NFC kartı doğrulanamadı. Kart olmadan devam edebilirsiniz." };
  }

  return { ok: true, card };
}

async function finishStandardAuthSuccess(
  userId: string,
  uniqueId?: string,
  device?: DeviceContext
): Promise<string> {
  const normalized = uniqueId?.trim();

  if (normalized) {
    await setPendingNfcCardCookie(normalized);
  }

  await ensureProfileForAuthUser(userId, normalized || undefined);
  await clearAuthPendingCookie();

  const cardResult = await loadOptionalNfcCard(normalized);

  if (cardResult.ok && cardResult.card && device) {
    const { card } = cardResult;

    if (
      card.isActive &&
      !(card.isClaimed && card.ownerId && !canBindClaimedCard(card.isClaimed, card.ownerId, userId))
    ) {
      const finished = await finishNfcPasswordAuth({
        uniqueId: normalized!,
        userId,
        card,
        device,
      });

      if (finished.success) {
        return finished.redirectTo;
      }
    }
  }

  await clearPendingNfcCardCookie();
  await confirmStorageAccessAction();
  return resolvePostAuthDestination(userId);
}

export async function startLoginAction(params: {
  email: string;
  password: string;
  uniqueId?: string;
  device?: DeviceContext;
}): Promise<AuthEmailActionSuccess | AuthEmailActionFailure> {
  try {
    return await withNfcAction("startLoginAction", async () => {
      const normalizedEmail = params.email.trim().toLowerCase();

      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { success: false, error: "Geçerli bir e-posta adresi girin." };
      }

      const passwordError = validatePasswordMin(params.password);
      if (passwordError) {
        return { success: false, error: passwordError };
      }

      const supabase = await createServerSupabaseClient();
      const signIn = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: params.password,
      });

      if (signIn.error) {
        const notRegistered =
          isUserNotRegisteredError(signIn.error) ||
          !(await authEmailExists(normalizedEmail));

        if (notRegistered) {
          return {
            success: false,
            error: "Bu e-posta ile kayıt bulunamadı.",
            redirectPath: authSignupPathClean({
              email: normalizedEmail,
              msg: "Önce hesap oluşturun.",
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
        return { success: false, error: "Oturum oluşturulamadı. Lütfen tekrar deneyin." };
      }

      const redirectTo = await finishStandardAuthSuccess(
        signIn.data.user.id,
        params.uniqueId,
        params.device
      );

      return { success: true, skipOtp: true, redirectTo };
    });
  } catch (error) {
    logNfcActionCriticalCatch("startLoginAction/catch", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Giriş işlemi başarısız.",
    };
  }
}

export async function startSignupAction(params: {
  email: string;
  password: string;
  confirmPassword: string;
  uniqueId?: string;
  device?: DeviceContext;
}): Promise<AuthEmailActionSuccess | AuthEmailActionFailure> {
  try {
    return await withNfcAction("startSignupAction", async () => {
      const normalizedEmail = params.email.trim().toLowerCase();

      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { success: false, error: "Geçerli bir e-posta adresi girin." };
      }

      const passwordError = validatePasswordPair(params.password, params.confirmPassword);
      if (passwordError) {
        return { success: false, error: passwordError };
      }

      const supabase = await createServerSupabaseClient();
      const signUp = await supabase.auth.signUp({
        email: normalizedEmail,
        password: params.password,
      });

      if (signUp.error) {
        if (isUserAlreadyExistsError(signUp.error)) {
          return {
            success: false,
            error: "Bu e-posta zaten kayıtlı.",
            redirectPath: authLoginPathClean({
              email: normalizedEmail,
              msg: "Zaten kayıtlısın, giriş yap.",
            }),
          };
        }

        return {
          success: false,
          error: authErrorMessage(signUp.error, "Hesap oluşturulamadı."),
        };
      }

      if (signUp.data.user?.id && signUp.data.session) {
        const redirectTo = await finishStandardAuthSuccess(
          signUp.data.user.id,
          params.uniqueId,
          params.device
        );

        return { success: true, skipOtp: true, redirectTo };
      }

      if (signUp.data.user?.id) {
        await ensureProfileForAuthUser(signUp.data.user.id, params.uniqueId);
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${SITE_URL}${AUTH_CALLBACK_PATH}`,
        },
      });

      if (otpError) {
        return {
          success: false,
          error: authErrorMessage(otpError, "Doğrulama kodu gönderilemedi."),
        };
      }

      await setAuthPendingCookie(normalizedEmail, params.uniqueId ?? "");

      return {
        success: true,
        redirectTo: buildVerifyOtpUrl(normalizedEmail, params.uniqueId),
      };
    });
  } catch (error) {
    logNfcActionCriticalCatch("startSignupAction/catch", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Kayıt işlemi başarısız.",
    };
  }
}

export async function verifyEmailOtpAction(params: {
  email: string;
  otp: string;
  uniqueId?: string;
  device?: DeviceContext;
}): Promise<{ success: true; redirectTo: string } | { success: false; error: string }> {
  return withNfcAction("verifyEmailOtpAction", async () => {
    const normalizedEmail = params.email.trim().toLowerCase();
    const token = normalizeOtpCode(params.otp);

    if (!normalizedEmail || token.length !== 6) {
      return { success: false, error: "6 haneli kodu eksiksiz girin." };
    }

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
      return { success: false, error: "Doğrulama kodu geçersiz veya süresi dolmuş." };
    }

    const redirectTo = await finishStandardAuthSuccess(
      verifyResult.data.user.id,
      params.uniqueId,
      params.device
    );

    return { success: true, redirectTo };
  });
}

export async function resendEmailOtpAction(
  email: string,
  uniqueId?: string
): Promise<{ success: true } | { success: false; error: string }> {
  return withNfcAction("resendEmailOtpAction", async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return { success: false, error: "E-posta adresi gerekli." };
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
      return {
        success: false,
        error: authErrorMessage(error, "Kod tekrar gönderilemedi."),
      };
    }

    await setAuthPendingCookie(normalizedEmail, uniqueId ?? "");
    return { success: true };
  });
}

/** Süresi dolmuş misafir oturumunu kapat */
export async function expireGuestSessionAction(): Promise<{ redirectTo: string }> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return { redirectTo: `${AUTH_SIGNUP_PATH}?msg=guest_expired` };
}
