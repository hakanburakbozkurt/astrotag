"use server";

import { MAX_COSMIC_ENERGY } from "@/lib/constants/cosmic";
import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
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
  const profileId = await getNfcSessionProfileId();

  if (!profileId) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      error: "Oturum doğrulanamadı. Lütfen tekrar giriş yapın.",
    };
  }

  const supabase = createSupabaseServiceClient();
  const { data: profile, error: profileError } = await supabase
    .from(PROFILE_TABLE)
    .select("role")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      error: "Profil doğrulanamadı.",
    };
  }

  if (profile.role !== ADMIN_ROLE) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Bu işlem yalnızca admin kullanıcılar içindir.",
    };
  }

  return { ok: true, userId: profileId };
}

export async function resetAllUsersCosmicEnergy(): Promise<ResetAllUsersEnergyResult> {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    return { success: false, error: admin.error, code: admin.code };
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data: profiles, error: readError } = await supabase
      .from(PROFILE_TABLE)
      .select("id, cosmic_energy");

    if (readError) {
      return {
        success: false,
        code: "DATABASE_ERROR",
        error: readError.message,
      };
    }

    const rows = profiles ?? [];
    const targetEnergy = MAX_COSMIC_ENERGY;
    const toUpdate = rows.filter((row) => (row.cosmic_energy ?? 0) !== targetEnergy);

    if (toUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from(PROFILE_TABLE)
        .update({ cosmic_energy: targetEnergy })
        .in(
          "id",
          toUpdate.map((row) => row.id)
        );

      if (updateError) {
        return {
          success: false,
          code: "DATABASE_ERROR",
          error: updateError.message,
        };
      }
    }

    return {
      success: true,
      targetEnergy,
      updatedCount: toUpdate.length,
      alreadyAtMaxCount: rows.length - toUpdate.length,
      totalProfiles: rows.length,
      message: `${toUpdate.length} kullanıcının enerjisi ${targetEnergy} olarak güncellendi.`,
    };
  } catch (error) {
    return {
      success: false,
      code: "DATABASE_ERROR",
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    };
  }
}
