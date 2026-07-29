"use server";

import type {
  GenerateManifestoInput,
  GenerateManifestoResult,
  UserManifestoRecord,
} from "@/lib/manifesto/types";
import {
  getOrGenerateDailyManifesto,
  loadManifestoState,
} from "@/services/manifestoService";
import { requireAuthUserId } from "@/lib/supabase-actions";
import type { UserData } from "@/types/user";

export async function loadManifestoStateAction(
  input: Pick<GenerateManifestoInput, "category" | "techniqueType">
): Promise<UserManifestoRecord | null> {
  try {
    const profileId = await requireAuthUserId();
    return loadManifestoState(profileId, input);
  } catch {
    return null;
  }
}

export async function generateDailyManifestoAction(
  user: UserData,
  input: GenerateManifestoInput
): Promise<GenerateManifestoResult> {
  try {
    const profileId = await requireAuthUserId();
    return getOrGenerateDailyManifesto(profileId, user, input);
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}
