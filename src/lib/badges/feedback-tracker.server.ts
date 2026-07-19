import "server-only";

import { grantEligibleBadges } from "@/lib/badges/badge-engine.server";
import type { GrantedBadgePayload } from "@/lib/badges/badge-definitions";
import { logAnalysisFeedback } from "@/lib/cosmic-profile/feedback-log.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PROFILES_TABLE = "profiles";

export type FeedbackTrackerResult = {
  feedbackCount: number;
  earnedBadges: GrantedBadgePayload[];
};

/** Geri bildirim kaydı + sayaç + rozet motoru */
export async function trackAnalysisFeedback(input: {
  userId: string;
  module: string;
  accurate: boolean;
  tier?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<FeedbackTrackerResult> {
  await logAnalysisFeedback({
    userId: input.userId,
    module: input.module,
    accurate: input.accurate,
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

  const earnedBadges = await grantEligibleBadges(input.userId, nextCount);

  return {
    feedbackCount: nextCount,
    earnedBadges,
  };
}
