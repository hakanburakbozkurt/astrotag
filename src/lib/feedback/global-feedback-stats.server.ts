import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";

export type GlobalFeedbackStats = {
  total_reviews: number;
  average_rating: number;
  accuracy_percentage: number;
};

const EMPTY_STATS: GlobalFeedbackStats = {
  total_reviews: 0,
  average_rating: 0,
  accuracy_percentage: 0,
};

function normalizeStats(raw: unknown): GlobalFeedbackStats {
  if (!raw || typeof raw !== "object") {
    return EMPTY_STATS;
  }

  const record = raw as Record<string, unknown>;

  return {
    total_reviews: Number(record.total_reviews ?? 0) || 0,
    average_rating: Number(record.average_rating ?? 0) || 0,
    accuracy_percentage: Number(record.accuracy_percentage ?? 0) || 0,
  };
}

async function fetchViaAggregateQuery(): Promise<GlobalFeedbackStats> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("analysis_feedback_logs")
    .select("rating")
    .not("rating", "is", null);

  if (error || !data) {
    throw new Error(error?.message ?? "Geri bildirim istatistikleri okunamadı.");
  }

  const ratings = data
    .map((row) => row.rating)
    .filter((rating): rating is number => typeof rating === "number");

  if (ratings.length === 0) {
    return EMPTY_STATS;
  }

  const total = ratings.length;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  const highRatings = ratings.filter((rating) => rating >= 4).length;

  return {
    total_reviews: total,
    average_rating: Math.round((sum / total) * 10) / 10,
    accuracy_percentage: Math.round((1000 * highRatings) / total) / 10,
  };
}

/** Küresel rating istatistikleri — RPC veya doğrudan aggregate */
export async function getGlobalFeedbackStats(): Promise<GlobalFeedbackStats> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc("get_global_feedback_stats");

  if (!error && data) {
    return normalizeStats(data);
  }

  if (error && !/function.*does not exist/i.test(error.message)) {
    console.warn("GLOBAL_FEEDBACK_STATS_RPC:", error.message);
  }

  return fetchViaAggregateQuery();
}
