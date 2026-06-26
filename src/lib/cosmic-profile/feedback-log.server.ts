import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

const ANALYSIS_FEEDBACK_TABLE = "analysis_feedback_logs";

export async function logInaccurateAnalysisFeedback(input: {
  userId: string;
  module?: string;
  tier?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  console.error("[Hatalı_AI_Çıktısı]", {
    module: input.module ?? "cosmic-profile",
    tier: input.tier,
    referenceId: input.referenceId,
    ...input.metadata,
  });

  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from(ANALYSIS_FEEDBACK_TABLE).insert({
      user_id: input.userId,
      module: input.module ?? "cosmic-profile",
      feedback: "Hatalı_AI_Çıktısı",
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
