"use server";

import { redirect } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";
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
  const candidateId = await getNfcSessionProfileId();

  if (!candidateId?.trim()) {
    redirectToLogin();
    throw new SupabaseActionError("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
  }

  const supabase = createSupabaseServiceClient();
  const { data: profile, error: profileError } = await supabase
    .from(PROFILE_TABLE)
    .select("id")
    .eq("id", candidateId)
    .maybeSingle();

  if (profileError) {
    mapSupabaseError(profileError, "Profil doğrulanamadı.");
  }

  const profileId = profile?.id?.trim();
  if (!profileId) {
    throw new SupabaseActionError(
      "Profiliniz veritabanında bulunamadı. Soru göndermeden önce kayıt formunu tamamlayın."
    );
  }

  return profileId;
}

async function ensureProfileComplete(userId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("is_profile_complete")
    .eq("id", userId)
    .maybeSingle();

  if (error || data?.is_profile_complete !== true) {
    redirect(PROFILE_SETUP_PATH);
  }
}

async function logCosmicQuestion(userId: string, question: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from(COSMIC_LOGS_TABLE).insert({
    user_id: userId,
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

    const userId = await resolveProfileUserId();
    await ensureProfileComplete(userId);
    await consumeStarPointsForQuestion();
    await logCosmicQuestion(userId, trimmed);

    const supabase = createSupabaseServiceClient();
    const payload: HoraryQuestionInsert = {
      user_id: userId,
      question: trimmed,
      ai_answer: null,
    };

    const { data, error } = await supabase
      .from(HORARY_QUESTIONS_TABLE)
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
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
