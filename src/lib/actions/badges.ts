"use server";

import { getUserBadgeState } from "@/lib/badges/badge-engine.server";
import { BadgeManager } from "@/lib/badges/badge-manager";
import {
  BADGE_DEFINITIONS,
  type BadgeIconId,
  type GrantedBadgePayload,
} from "@/lib/badges/badge-definitions";
import { getNfcSessionProfileId } from "@/lib/nfc/session.server";

export type BadgeProgressItem = GrantedBadgePayload & {
  earned: boolean;
  earnedAt?: string;
  remaining: number;
  progressPercent: number;
  currentCount: number;
};

export type UserBadgeProgress = {
  feedbackCount: number;
  badges: BadgeProgressItem[];
  nextBadge: { name: string; remaining: number; threshold: number } | null;
};

export async function getUserBadgeProgress(): Promise<UserBadgeProgress | null> {
  const userId = await getNfcSessionProfileId();
  if (!userId) {
    return null;
  }

  const state = await getUserBadgeState(userId);
  const earnedIds = new Set(state.earnedBadges.map((badge) => badge.id));

  const badges: BadgeProgressItem[] = BADGE_DEFINITIONS.map((definition) => {
    const earned = earnedIds.has(definition.id);
    const earnedRow = state.earnedBadges.find((row) => row.id === definition.id);
    const progress = BadgeManager.computeBadgeProgress(
      state.feedbackCount,
      definition.threshold,
      earned
    );

    return {
      ...definition,
      earned,
      earnedAt: earnedRow?.earnedAt,
      remaining: progress.remaining,
      progressPercent: progress.progressPercent,
      currentCount: progress.currentCount,
    };
  });

  return {
    feedbackCount: state.feedbackCount,
    badges,
    nextBadge: state.nextBadge,
  };
}

export type { BadgeIconId, GrantedBadgePayload };
