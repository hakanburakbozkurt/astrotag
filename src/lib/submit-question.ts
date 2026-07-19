"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";
import {
  assertProfileIdExists,
  resolveProfileIdFromNfcSession,
} from "@/lib/nfc/resolve-profile-id.server";
import type { HoraryQuestion, HoraryQuestionInsert } from "@/types/database";
import { SupabaseActionError, redirectToLogin } from "@/lib/supabase-action-error";
import { consumeStarPointsForQuestion } from "@/lib/supabase-actions";
import { STAR_POINTS_COST_PER_ACTION } from "@/lib/constants/cosmic";

const HORARY_QUESTIONS_TABLE = "horary_questions";
const COSMIC_LOGS_TABLE = "cosmic_logs";
const PROFILE_TABLE = "profiles";

function mapSupabaseError(
  error: { message: string } | null,
  fallback: string
): never {
  throw new SupabaseActionError(error?.message ?? fallback);
}

export async function resolveProfileUserId(): Promise<string> {
  const resolved = await resolveProfileIdFromNfcSession();

  console.log("[resolveProfileUserId] oturum çözümlemesi", {
    found: Boolean(resolved),
    source: resolved?.source ?? null,
    sessionId: resolved?.sessionId ?? null,
    profileId: resolved?.profileId ?? null,
  });

  if (!resolved?.profileId?.trim()) {
    redirectToLogin();
    throw new SupabaseActionError("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
  }

  try {
    return await assertProfileIdExists(resolved.profileId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Profil doğrulanamadı.";
    throw new SupabaseActionError(message);
  }
}

async function ensureProfileComplete(profileId: string): Promise<void> {
  const supabaseAdmin = createServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from(PROFILE_TABLE)
    .select("is_profile_complete")
    .eq("id", profileId)
    .maybeSingle();

  if (error || data?.is_profile_complete !== true) {
    redirect(PROFILE_SETUP_PATH);
  }
}

async function logCosmicQuestion(profileId: string, question: string): Promise<void> {
  const supabaseAdmin = createServiceRoleClient();
  const { error } = await supabaseAdmin.from(COSMIC_LOGS_TABLE).insert({
    user_id: profileId,
    question,
    star_points_delta: -STAR_POINTS_COST_PER_ACTION,
  });

  if (error) {
    console.error("[cosmic_logs] insert failed:", error.message);
  }
}

export async function submitHoraryQuestion(
  question: string
): Promise<HoraryQuestion> {
  try {
    const trimmed = question.trim();
    if (!trimmed) {
      throw new SupabaseActionError("Lütfen bir soru yazın.");
    }

    const profileId = await resolveProfileUserId();
    console.log("Kayıt atılan Profile ID:", profileId);

    await ensureProfileComplete(profileId);
    await consumeStarPointsForQuestion();
    await logCosmicQuestion(profileId, trimmed);

    const supabaseAdmin = createServiceRoleClient();
    const payload: HoraryQuestionInsert = {
      user_id: profileId,
      question: trimmed,
      ai_answer: null,
    };

    const { data, error } = await supabaseAdmin
      .from(HORARY_QUESTIONS_TABLE)
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("[submitHoraryQuestion] insert failed", {
        profileId,
        code: error?.code ?? null,
        message: error?.message ?? null,
        hint: error?.hint ?? null,
      });
      mapSupabaseError(error, "Soru kaydedilemedi.");
    }

    return data as HoraryQuestion;
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Soru gönderilirken bir hata oluştu.");
  }
}
