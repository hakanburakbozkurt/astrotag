"use server";

import { runHoraryReading } from "@/lib/actions/horary-reading";
import { getHoraryQuestion } from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import type { HoraryQuestion } from "@/types/database";

/**
 * @deprecated Tek adımlı akış için `runHoraryReading` kullanın.
 */
export async function submitHoraryQuestion(
  question: string
): Promise<HoraryQuestion> {
  const result = await runHoraryReading(question);

  if (!result.success) {
    throw new SupabaseActionError(result.error);
  }

  const saved = await getHoraryQuestion(result.questionId);
  if (!saved) {
    throw new SupabaseActionError("Horary kaydı okunamadı.");
  }

  return saved;
}
