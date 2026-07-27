import "server-only";

import type { User } from "@supabase/supabase-js";
import {
  AUTH_FORGOT_PASSWORD_PATH,
  AUTH_RESET_PASSWORD_PATH,
} from "@/lib/auth/auth-config";
import type { AuthActionResult, AuthSessionSnapshot } from "@/lib/auth/auth-service.types";
import { isValidExpertEmail, normalizeExpertEmail } from "@/lib/expert/expert-auth-email.server";
import { SITE_URL } from "@/lib/nfc/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function toSessionSnapshot(user: User, expiresAt?: number | null): AuthSessionSnapshot {
  return {
    authUserId: user.id,
    email: user.email?.trim().toLowerCase() ?? null,
    isAnonymous: user.is_anonymous === true,
    expiresAt: expiresAt ?? null,
  };
}

export async function getServerAuthSession(): Promise<{
  user: User | null;
  snapshot: AuthSessionSnapshot | null;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, snapshot: null };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    user,
    snapshot: toSessionSnapshot(user, session?.expires_at ?? null),
  };
}

export async function requestPasswordResetEmail(
  rawEmail: string
): Promise<AuthActionResult> {
  const email = normalizeExpertEmail(rawEmail);

  if (!isValidExpertEmail(email)) {
    return { ok: false, error: "Geçerli bir e-posta adresi girin." };
  }

  const supabase = await createServerSupabaseClient();
  const redirectTo = `${SITE_URL}${AUTH_RESET_PASSWORD_PATH}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("[requestPasswordResetEmail]", error.message);
    return { ok: false, error: "Sıfırlama bağlantısı gönderilemedi." };
  }

  return {
    ok: true,
    message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
  };
}

export async function updateAuthenticatedPassword(
  newPassword: string
): Promise<AuthActionResult> {
  const trimmed = newPassword.trim();

  if (trimmed.length < 8) {
    return { ok: false, error: "Şifre en az 8 karakter olmalıdır." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return {
      ok: false,
      error: "Oturum bulunamadı. Sıfırlama bağlantısını tekrar kullanın.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: trimmed });

  if (error) {
    console.error("[updateAuthenticatedPassword]", error.message);
    return { ok: false, error: "Şifre güncellenemedi." };
  }

  return { ok: true, message: "Şifreniz güncellendi." };
}

export function passwordResetRedirectUrl(): string {
  return `${SITE_URL}${AUTH_RESET_PASSWORD_PATH}`;
}

export function forgotPasswordRedirectUrl(): string {
  return `${SITE_URL}${AUTH_FORGOT_PASSWORD_PATH}`;
}
