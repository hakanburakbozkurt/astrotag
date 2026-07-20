"use server";

import { trackAnalysisFeedback } from "@/lib/badges/feedback-tracker.server";
import type { GrantedBadgePayload } from "@/lib/badges/badge-definitions";
import {
  getGlobalFeedbackStats as fetchGlobalFeedbackStats,
  type GlobalFeedbackStats,
} from "@/lib/feedback/global-feedback-stats.server";
import { EMPTY_GLOBAL_FEEDBACK_STATS } from "@/lib/feedback/global-feedback-stats.shared";
import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
import { getStarPoints } from "@/lib/supabase-actions";

export type { GlobalFeedbackStats };

export type SubmitFeedbackResult = {
  success: boolean;
  feedbackCount?: number;
  rating?: number;
  starsEarned?: number;
  totalStarPoints?: number;
  earnedBadges?: GrantedBadgePayload[];
  milestoneReached?: boolean;
  error?: string;
};

/** Analiz geri bildirimi — rating (1–5) + sayaç + milestone ödülü */
export async function submitFeedback(input: {
  module: string;
  rating: number;
  referenceId?: string;
  tier?: string;
  metadata?: Record<string, unknown>;
}): Promise<SubmitFeedbackResult> {
  const profileId = await getNfcSessionProfileId();
  if (!profileId) {
    return { success: false, error: "Oturum bulunamadı." };
  }

  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const moduleName = input.module.trim() || "analysis";

  try {
    const tracker = await trackAnalysisFeedback({
      userId: profileId,
      module: moduleName,
      rating,
      tier: input.tier,
      referenceId: input.referenceId,
      metadata: input.metadata,
    });

    const starsEarned = tracker.earnedBadges.reduce(
      (sum, badge) => sum + badge.starReward,
      0
    );

    let totalStarPoints = tracker.totalStarPoints;
    if (totalStarPoints === undefined && tracker.earnedBadges.length > 0) {
      totalStarPoints = await getStarPoints();
    }

    return {
      success: true,
      feedbackCount: tracker.feedbackCount,
      rating,
      starsEarned: starsEarned > 0 ? starsEarned : undefined,
      totalStarPoints,
      earnedBadges: tracker.earnedBadges,
      milestoneReached: tracker.earnedBadges.length > 0,
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

/** Sosyal kanıt — toplam yorum, ortalama puan, isabet oranı (hata → boş veri, redirect yok) */
export async function getGlobalFeedbackStats(): Promise<GlobalFeedbackStats> {
  try {
    return await fetchGlobalFeedbackStats();
  } catch (error) {
    console.error("[getGlobalFeedbackStats/action]", error);
    return EMPTY_GLOBAL_FEEDBACK_STATS;
  }
}
