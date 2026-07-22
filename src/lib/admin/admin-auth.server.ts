import "server-only";

import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const ADMIN_ROLE = "admin";

export type AdminAuthErrorCode = "UNAUTHORIZED" | "FORBIDDEN";

export type AdminAuthResult =
  | { ok: true; profileId: string }
  | { ok: false; error: string; code: AdminAuthErrorCode };

export async function requireAdminUser(): Promise<AdminAuthResult> {
  const profileId = await getNfcSessionProfileId();

  if (!profileId) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      error: "Oturum doğrulanamadı. Lütfen tekrar giriş yapın.",
    };
  }

  const supabase = createServiceRoleClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      error: "Profil doğrulanamadı.",
    };
  }

  if (profile.is_active === false) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Hesabınız askıya alınmıştır.",
    };
  }

  if (profile.role !== ADMIN_ROLE) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Bu işlem yalnızca admin kullanıcılar içindir.",
    };
  }

  return { ok: true, profileId };
}

export async function isAdminUser(): Promise<boolean> {
  const result = await requireAdminUser();
  return result.ok;
}
