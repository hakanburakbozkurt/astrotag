import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";

const ANALYSIS_FEEDBACK_TABLE = "analysis_feedback_logs";

function feedbackLabelForRating(rating: number): string {
  if (rating >= 4) return "Olumlu";
  if (rating >= 3) return "Nötr";
  return "Geliştirilmeli";
}

export async function logAnalysisFeedback(input: {
  userId: string;
  module?: string;
  rating: number;
  tier?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));

  if (rating <= 2) {
    console.error("[Düşük_Puan_Geri_Bildirim]", {
      module: input.module ?? "analysis",
      rating,
      tier: input.tier,
      referenceId: input.referenceId,
      ...input.metadata,
    });
  }

  try {
    const supabaseAdmin = createServiceRoleClient();
    const { error } = await supabaseAdmin.from(ANALYSIS_FEEDBACK_TABLE).insert({
      user_id: input.userId,
      module: input.module ?? "analysis",
      feedback: feedbackLabelForRating(rating),
      rating,
      tier: input.tier ?? null,
      reference_id: input.referenceId ?? null,
      metadata: input.metadata ?? null,
    });

    if (error) {
      console.error("ANALYSIS_FEEDBACK_LOG_ERROR:", error.message);
    }
  } catch (error) {
    console.error("ANALYSIS_FEEDBACK_LOG_ERROR:", error);
  }
}

/** @deprecated rating kullanın */
export async function logInaccurateAnalysisFeedback(input: {
  userId: string;
  module?: string;
  tier?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await logAnalysisFeedback({
    ...input,
    rating: 1,
  });
}
