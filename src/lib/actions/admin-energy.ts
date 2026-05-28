"use server";

import { MAX_COSMIC_ENERGY } from "@/lib/constants/cosmic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const PROFILE_TABLE = "profiles";
const ADMIN_ROLE = "admin";

export type ResetAllUsersEnergyErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFIG_ERROR"
  | "DATABASE_ERROR";

export type ResetAllUsersEnergyResult =
  | {
      success: true;
      targetEnergy: number;
      updatedCount: number;
      alreadyAtMaxCount: number;
      totalProfiles: number;
      message: string;
    }
  | {
      success: false;
      error: string;
      code: ResetAllUsersEnergyErrorCode;
    };

async function requireAdminUser(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string; code: ResetAllUsersEnergyErrorCode }
> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      error: "Oturum doğrulanamadı. Lütfen tekrar giriş yapın.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from(PROFILE_TABLE)
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      error: "Admin yetkisi doğrulanamadı.",
    };
  }

  if (profile?.role !== ADMIN_ROLE) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Bu işlem yalnızca admin kullanıcılar tarafından çalıştırılabilir.",
    };
  }

  return { ok: true, userId: user.id };
}

/**
 * Tüm kullanıcıların cosmic_energy değerini 100'e eşitler.
 * Yalnızca profiles.role = 'admin' olan oturumlar çalıştırabilir.
 * Zaten 100 olan kayıtlar güncellenmez.
 */
export async function resetAllUsersEnergy(): Promise<ResetAllUsersEnergyResult> {
  try {
    const adminCheck = await requireAdminUser();

    if (!adminCheck.ok) {
      return {
        success: false,
        error: adminCheck.error,
        code: adminCheck.code,
      };
    }

    let serviceClient;

    try {
      serviceClient = createSupabaseServiceClient();
    } catch {
      return {
        success: false,
        code: "CONFIG_ERROR",
        error: "Sunucu yapılandırması eksik. Service role anahtarı tanımlı değil.",
      };
    }

    const { count: alreadyAtMaxCount, error: alreadyFullError } =
      await serviceClient
        .from(PROFILE_TABLE)
        .select("id", { count: "exact", head: true })
        .eq("cosmic_energy", MAX_COSMIC_ENERGY);

    const { count: totalProfiles, error: totalError } = await serviceClient
      .from(PROFILE_TABLE)
      .select("id", { count: "exact", head: true });

    const { data: updatedRows, error: updateError } = await serviceClient
      .from(PROFILE_TABLE)
      .update({ cosmic_energy: MAX_COSMIC_ENERGY })
      .neq("cosmic_energy", MAX_COSMIC_ENERGY)
      .select("id");

    if (alreadyFullError || totalError || updateError) {
      const message =
        updateError?.message ??
        alreadyFullError?.message ??
        totalError?.message ??
        "Enerji güncellemesi başarısız oldu.";

      return {
        success: false,
        code: "DATABASE_ERROR",
        error: message,
      };
    }

    const updatedCount = updatedRows?.length ?? 0;
    const skippedCount = alreadyAtMaxCount ?? 0;
    const total = totalProfiles ?? updatedCount + skippedCount;

    return {
      success: true,
      targetEnergy: MAX_COSMIC_ENERGY,
      updatedCount,
      alreadyAtMaxCount: skippedCount,
      totalProfiles: total,
      message:
        updatedCount === 0
          ? `Tüm kullanıcılar zaten ${MAX_COSMIC_ENERGY} enerjiye sahip. Güncelleme yapılmadı.`
          : `${updatedCount} kullanıcının enerjisi ${MAX_COSMIC_ENERGY}'e yükseltildi. ${skippedCount} kullanıcı zaten doluydu.`,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Enerji sıfırlama işlemi beklenmedik bir hata ile sonuçlandı.";

    return {
      success: false,
      code: "DATABASE_ERROR",
      error: message,
    };
  }
}
