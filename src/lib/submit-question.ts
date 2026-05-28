import { supabase } from "@/lib/supabase";
import { getDevTestUserId, isDevAuthBypassActive } from "@/lib/dev-mode";
import type { HoraryQuestion, HoraryQuestionInsert } from "@/types/database";
import {
  consumeCosmicEnergyForQuestion,
  redirectToLogin,
  SupabaseActionError,
} from "@/lib/supabase-actions";

const HORARY_QUESTIONS_TABLE = "horary_questions";
const PROFILE_TABLE = "profiles";

function mapSupabaseError(
  error: { message: string } | null,
  fallback: string
): never {
  throw new SupabaseActionError(error?.message ?? fallback);
}

/**
 * FK (horary_questions_user_id_fkey) için profiles.id ile eşleşen geçerli user_id döner.
 * Önce supabase.auth.getUser(), gerekirse dev test id kullanılır.
 */
export async function resolveProfileUserId(): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  let candidateId = user?.id?.trim() ?? "";

  if (!candidateId && isDevAuthBypassActive()) {
    candidateId = getDevTestUserId().trim();
  }

  if (authError && !candidateId) {
    redirectToLogin();
    throw new SupabaseActionError("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
  }

  if (!candidateId) {
    redirectToLogin();
    throw new SupabaseActionError(
      "Kullanıcı kimliği boş. Lütfen tekrar giriş yapın."
    );
  }

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

    if (!userId.trim()) {
      throw new SupabaseActionError("Kullanıcı kimliği boş gönderilemez.");
    }

    await consumeCosmicEnergyForQuestion();

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
