"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
import type { HoraryQuestion, HoraryQuestionInsert } from "@/types/database";
import { SupabaseActionError, redirectToLogin } from "@/lib/supabase-action-error";
import { consumeCosmicEnergyForQuestion } from "@/lib/supabase-actions";

const HORARY_QUESTIONS_TABLE = "horary_questions";
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

export async function submitHoraryQuestion(
  question: string
): Promise<HoraryQuestion> {
  try {
    const trimmed = question.trim();
    if (!trimmed) {
      throw new SupabaseActionError("Lütfen bir soru yazın.");
    }

    const userId = await resolveProfileUserId();
    await consumeCosmicEnergyForQuestion();

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
