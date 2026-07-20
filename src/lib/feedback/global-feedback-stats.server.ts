import "server-only";

import {
  EMPTY_GLOBAL_FEEDBACK_STATS,
  type GlobalFeedbackStats,
} from "@/lib/feedback/global-feedback-stats.shared";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type { GlobalFeedbackStats };
export { EMPTY_GLOBAL_FEEDBACK_STATS };

function normalizeStats(raw: unknown): GlobalFeedbackStats {
  if (!raw || typeof raw !== "object") {
    return EMPTY_GLOBAL_FEEDBACK_STATS;
  }

  const record = raw as Record<string, unknown>;

  return {
    total_reviews: Number(record.total_reviews ?? 0) || 0,
    average_rating: Number(record.average_rating ?? 0) || 0,
    accuracy_percentage: Number(record.accuracy_percentage ?? 0) || 0,
  };
}

/** Küresel rating istatistikleri — asla throw etmez; hata durumunda boş veri döner */
export async function getGlobalFeedbackStats(): Promise<GlobalFeedbackStats> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("get_global_feedback_stats");

    if (!error && data) {
      return normalizeStats(data);
    }

    if (error) {
      console.warn("[getGlobalFeedbackStats] RPC:", error.message);
    }
  } catch (error) {
    console.error("[getGlobalFeedbackStats]", error);
  }

  return EMPTY_GLOBAL_FEEDBACK_STATS;
}
