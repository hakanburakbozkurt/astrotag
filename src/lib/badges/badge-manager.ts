import type { BadgeDefinition } from "@/lib/badges/badge-definitions";

export type BadgeProgressSnapshot = {
  progressPercent: number;
  remaining: number;
  earned: boolean;
  currentCount: number;
  threshold: number;
};

/** UI + server — rozet ilerleme hesabı (user_badges + feedback_count uyumlu) */
export function computeBadgeProgress(
  feedbackCount: number,
  threshold: number,
  earned: boolean
): BadgeProgressSnapshot {
  if (earned) {
    return {
      progressPercent: 100,
      remaining: 0,
      earned: true,
      currentCount: threshold,
      threshold,
    };
  }

  const safeThreshold = Math.max(threshold, 1);
  const progressPercent = Math.min(
    100,
    Math.round((Math.max(0, feedbackCount) / safeThreshold) * 100)
  );

  return {
    progressPercent,
    remaining: Math.max(0, threshold - feedbackCount),
    earned: false,
    currentCount: feedbackCount,
    threshold,
  };
}

export function mapDefinitionsToProgress(
  definitions: BadgeDefinition[],
  feedbackCount: number,
  earnedBadgeIds: Set<string>
): Array<BadgeDefinition & BadgeProgressSnapshot & { earnedAt?: string }> {
  return definitions.map((definition) => {
    const earned = earnedBadgeIds.has(definition.id);
    const progress = computeBadgeProgress(
      feedbackCount,
      definition.threshold,
      earned
    );

    return {
      ...definition,
      ...progress,
    };
  });
}

/** @alias BadgeManager — rozet motoru ile paylaşılan SSOT */
export const BadgeManager = {
  computeBadgeProgress,
  mapDefinitionsToProgress,
};
