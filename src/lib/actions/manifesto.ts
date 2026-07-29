"use server";

import type {
  DailyCosmicModalPayload,
  GenerateManifestoInput,
  GenerateManifestoResult,
  ManifestoHistoryItem,
  UserManifestoRecord,
} from "@/lib/manifesto/types";
import {
  dismissDailyCosmicModal,
  getOrGenerateDailyManifesto,
  listManifestoHistory,
  loadManifestoState,
  prepareDailyCosmicModal,
} from "@/services/manifestoService";
import { requireAuthUserId } from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import type { UserData } from "@/types/user";

export async function loadManifestoStateAction(
  input: Pick<GenerateManifestoInput, "category" | "techniqueType">
): Promise<UserManifestoRecord | null> {
  try {
    const profileId = await requireAuthUserId();
    console.info("[manifestoAction] loadManifestoState", {
      profileId,
      category: input.category,
      techniqueType: input.techniqueType,
    });
    return loadManifestoState(profileId, input);
  } catch (error) {
    console.error("[manifestoAction] loadManifestoState auth/read failed:", {
      category: input.category,
      techniqueType: input.techniqueType,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

export async function generateDailyManifestoAction(
  user: UserData,
  input: GenerateManifestoInput
): Promise<GenerateManifestoResult> {
  try {
    const profileId = await requireAuthUserId();
    console.info("[manifestoAction] generateDailyManifesto", {
      profileId,
      category: input.category,
      techniqueType: input.techniqueType,
      hasIntention: Boolean(input.intention.trim()),
    });

    const result = await getOrGenerateDailyManifesto(profileId, user, input);

    if (!result.ok) {
      console.error("[manifestoAction] generateDailyManifesto failed:", {
        profileId,
        category: input.category,
        techniqueType: input.techniqueType,
        error: result.error,
        debugCode: result.debugCode,
      });
    }

    return result;
  } catch (error) {
    const message =
      error instanceof SupabaseActionError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Oturum geçersiz.";

    console.error("[manifestoAction] generateDailyManifesto auth error:", {
      category: input.category,
      techniqueType: input.techniqueType,
      error: message,
    });

    return { ok: false, error: message, debugCode: "AUTH_FAILED" };
  }
}

export async function prepareDailyCosmicModalAction(
  user: UserData
): Promise<DailyCosmicModalPayload> {
  try {
    const profileId = await requireAuthUserId();
    return prepareDailyCosmicModal(profileId, user);
  } catch (error) {
    console.error("[manifestoAction] prepareDailyCosmicModal failed:", error);
    return { showModal: false, manifesto: null, error: "Oturum geçersiz." };
  }
}

export async function dismissDailyCosmicModalAction(
  manifestoId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const profileId = await requireAuthUserId();
    return dismissDailyCosmicModal(profileId, manifestoId);
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}

export async function listManifestoHistoryAction(): Promise<ManifestoHistoryItem[]> {
  try {
    const profileId = await requireAuthUserId();
    return listManifestoHistory(profileId);
  } catch {
    return [];
  }
}
