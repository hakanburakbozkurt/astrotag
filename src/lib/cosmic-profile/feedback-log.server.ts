import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";

const ANALYSIS_FEEDBACK_TABLE = "analysis_feedback_logs";

export async function logAnalysisFeedback(input: {
  userId: string;
  module?: string;
  accurate: boolean;
  tier?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!input.accurate) {
    console.error("[Hatalı_AI_Çıktısı]", {
      module: input.module ?? "analysis",
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
      feedback: input.accurate ? "Doğru" : "Hatalı_AI_Çıktısı",
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

/** @deprecated logAnalysisFeedback kullanın */
export async function logInaccurateAnalysisFeedback(input: {
  userId: string;
  module?: string;
  tier?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await logAnalysisFeedback({
    ...input,
    accurate: false,
  });
}
