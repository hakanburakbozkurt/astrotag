import "server-only";

import type { GrantedBadgePayload } from "@/lib/badges/badge-definitions";
import { processFeedbackMilestones } from "@/lib/badges/reward-system.server";
import { logAnalysisFeedback } from "@/lib/cosmic-profile/feedback-log.server";
import { MIN_MILESTONE_RATING } from "@/lib/constants/cosmic";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PROFILES_TABLE = "profiles";

export type FeedbackTrackerResult = {
  feedbackCount: number;
  earnedBadges: GrantedBadgePayload[];
  totalStarPoints?: number;
};

function clampRating(rating: number): number {
  return Math.min(5, Math.max(1, Math.round(rating)));
}

/** Geri bildirim kaydı + sayaç + milestone rozet motoru */
export async function trackAnalysisFeedback(input: {
  userId: string;
  module: string;
  rating: number;
  tier?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<FeedbackTrackerResult> {
  const rating = clampRating(input.rating);

  await logAnalysisFeedback({
    userId: input.userId,
    module: input.module,
    rating,
    tier: input.tier,
    referenceId: input.referenceId,
    metadata: input.metadata,
  });

  const supabaseAdmin = createServiceRoleClient();

  const { data: profile, error: readError } = await supabaseAdmin
    .from(PROFILES_TABLE)
    .select("feedback_count")
    .eq("id", input.userId)
    .maybeSingle();

  if (readError || !profile) {
    throw new Error("Geri bildirim sayacı okunamadı.");
  }

  const nextCount = (profile.feedback_count ?? 0) + 1;

  const { error: updateError } = await supabaseAdmin
    .from(PROFILES_TABLE)
    .update({ feedback_count: nextCount })
    .eq("id", input.userId);

  if (updateError) {
    throw new Error("Geri bildirim sayacı güncellenemedi.");
  }

  const earnedBadges = await processFeedbackMilestones({
    profileId: input.userId,
    feedbackCount: nextCount,
    rating,
  });

  let totalStarPoints: number | undefined;
  if (earnedBadges.length > 0) {
    const { data: wallet } = await supabaseAdmin
      .from(PROFILES_TABLE)
      .select("star_points, star_points_bonus")
      .eq("id", input.userId)
      .maybeSingle();

    if (wallet) {
      totalStarPoints = (wallet.star_points ?? 0) + (wallet.star_points_bonus ?? 0);
    }
  }

  return {
    feedbackCount: nextCount,
    earnedBadges,
    totalStarPoints,
  };
}

export function isPositiveFeedbackRating(rating: number): boolean {
  return clampRating(rating) >= 3;
}

export function qualifiesForMilestone(rating: number): boolean {
  return clampRating(rating) >= MIN_MILESTONE_RATING;
}
