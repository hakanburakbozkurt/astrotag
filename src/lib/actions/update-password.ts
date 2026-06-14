"use server";

import { validatePasswordPair } from "@/lib/auth/password-rules";
import { logNfcError } from "@/lib/nfc/error-logger";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdatePasswordInput = {
  password: string;
  confirmPassword: string;
};

export async function updateUserPassword(
  input: UpdatePasswordInput
): Promise<{ success: true } | { success: false; error: string }> {
  return withNfcAction("updateUserPassword", async () => {
    const passwordError = validatePasswordPair(
      input.password,
      input.confirmPassword
    );

    if (passwordError) {
      return { success: false, error: passwordError };
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error:
          "Hesap oturumu bulunamadı. E-posta ile giriş yaptıysanız tekrar deneyin.",
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: input.password,
    });

    if (error) {
      logNfcError(
        { layer: "action", handler: "updateUserPassword" },
        error,
        { userId: user.id }
      );
      return {
        success: false,
        error: error.message || "Şifre güncellenemedi.",
      };
    }

    return { success: true };
  });
}
