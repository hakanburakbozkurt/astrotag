"use server";

import { trackAnalysisFeedback } from "@/lib/badges/feedback-tracker.server";
import { creditFeedbackAccurateReward } from "@/lib/badges/feedback-reward.server";
import type { GrantedBadgePayload } from "@/lib/badges/badge-definitions";
import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
import { getStarPoints } from "@/lib/supabase-actions";

export type SubmitFeedbackResult = {
  success: boolean;
  feedbackCount?: number;
  starsEarned?: number;
  totalStarPoints?: number;
  earnedBadges?: GrantedBadgePayload[];
  error?: string;
};

/** Analiz geri bildirimi — log + sayaç + (doğruysa) yıldız ödülü + rozet kontrolü */
export async function submitFeedback(input: {
  module: string;
  accurate: boolean;
  referenceId?: string;
  tier?: string;
  metadata?: Record<string, unknown>;
}): Promise<SubmitFeedbackResult> {
  const profileId = await getNfcSessionProfileId();
  if (!profileId) {
    return { success: false, error: "Oturum bulunamadı." };
  }

  const moduleName = input.module.trim() || "analysis";

  try {
    const tracker = await trackAnalysisFeedback({
      userId: profileId,
      module: moduleName,
      accurate: input.accurate,
      tier: input.tier,
      referenceId: input.referenceId,
      metadata: input.metadata,
    });

    let starsEarned = 0;
    let totalStarPoints: number | undefined;

    if (input.accurate) {
      const reward = await creditFeedbackAccurateReward({
        profileId,
        referenceId: input.referenceId,
        module: moduleName,
      });
      starsEarned = reward.starsEarned;
      totalStarPoints = reward.totalStarPoints;
    } else if (tracker.earnedBadges.length > 0) {
      totalStarPoints = await getStarPoints();
    }

    return {
      success: true,
      feedbackCount: tracker.feedbackCount,
      starsEarned,
      totalStarPoints,
      earnedBadges: tracker.earnedBadges,
    };
  } catch (error) {
    console.error("SUBMIT_FEEDBACK_ERROR:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Geri bildirim kaydedilemedi.",
    };
  }
}
