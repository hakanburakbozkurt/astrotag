"use server";

import { requireAdminUser } from "@/lib/admin/admin-auth.server";
import { MAX_STAR_POINTS } from "@/lib/constants/cosmic";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const PROFILE_TABLE = "profiles";

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

async function requireAdminUserForEnergy(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string; code: ResetAllUsersEnergyErrorCode }
> {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    return {
      ok: false,
      code: admin.code === "FORBIDDEN" ? "FORBIDDEN" : "UNAUTHORIZED",
      error: admin.error,
    };
  }
  return { ok: true, userId: admin.profileId };
}

export async function resetAllUsersCosmicEnergy(): Promise<ResetAllUsersEnergyResult> {
  const admin = await requireAdminUserForEnergy();
  if (!admin.ok) {
    return { success: false, error: admin.error, code: admin.code };
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data: profiles, error: readError } = await supabase
      .from(PROFILE_TABLE)
      .select("id, star_points");

    if (readError) {
      return {
        success: false,
        code: "DATABASE_ERROR",
        error: readError.message,
      };
    }

    const rows = profiles ?? [];
    const targetStarPoints = MAX_STAR_POINTS;
    const toUpdate = rows.filter((row) => (row.star_points ?? 0) !== targetStarPoints);

    if (toUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from(PROFILE_TABLE)
        .update({ star_points: targetStarPoints })
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
      targetEnergy: targetStarPoints,
      updatedCount: toUpdate.length,
      alreadyAtMaxCount: rows.length - toUpdate.length,
      totalProfiles: rows.length,
      message: `${toUpdate.length} kullanıcının yıldız puanı ${targetStarPoints} olarak güncellendi.`,
    };
  } catch (error) {
    return {
      success: false,
      code: "DATABASE_ERROR",
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    };
  }
}
