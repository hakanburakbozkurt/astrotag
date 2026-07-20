import "server-only";

import {
  BADGE_DEFINITIONS,
  getBadgeDefinition,
  toGrantedBadgePayload,
  type GrantedBadgePayload,
} from "@/lib/badges/badge-definitions";
import { logStarsLedgerEntry } from "@/lib/stars/stars-ledger.server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { MIN_MILESTONE_RATING } from "@/lib/constants/cosmic";

const PROFILES_TABLE = "profiles";
const USER_BADGES_TABLE = "user_badges";

export type GrantBadgeResult =
  | { granted: true; badge: GrantedBadgePayload; totalStarPoints: number }
  | { granted: false; reason: "unknown_badge" | "already_earned" | "db_error" };

async function creditBadgeStarReward(
  userId: string,
  amount: number
): Promise<{ starPoints: number; starPointsBonus: number; totalStarPoints: number }> {
  const supabaseAdmin = createServiceRoleClient();

  const { data, error: readError } = await supabaseAdmin
    .from(PROFILES_TABLE)
    .select("star_points, star_points_bonus")
    .eq("id", userId)
    .maybeSingle();

  if (readError || !data) {
    throw new Error("Rozet ödülü için profil okunamadı.");
  }

  const starPoints = data.star_points ?? 0;
  const starPointsBonus = (data.star_points_bonus ?? 0) + amount;

  const { error: updateError } = await supabaseAdmin
    .from(PROFILES_TABLE)
    .update({ star_points_bonus: starPointsBonus })
    .eq("id", userId);

  if (updateError) {
    throw new Error("Rozet yıldız ödülü uygulanamadı.");
  }

  return {
    starPoints,
    starPointsBonus,
    totalStarPoints: starPoints + starPointsBonus,
  };
}

/** Tek rozet ver — daha önce kazanıldıysa no-op */
export async function grantBadge(
  userId: string,
  badgeId: string,
  options?: { ledgerType?: "BADGE_REWARD" | "MILESTONE_REWARD" }
): Promise<GrantBadgeResult> {
  return grantBadgeInternal(userId, badgeId, options?.ledgerType ?? "BADGE_REWARD");
}

/** Milestone geri bildirim ödülü — stars_ledger: MILESTONE_REWARD */
export async function grantMilestoneBadge(
  userId: string,
  badgeId: string
): Promise<GrantBadgeResult> {
  return grantBadgeInternal(userId, badgeId, "MILESTONE_REWARD");
}

async function grantBadgeInternal(
  userId: string,
  badgeId: string,
  ledgerType: "BADGE_REWARD" | "MILESTONE_REWARD"
): Promise<GrantBadgeResult> {
  const definition = getBadgeDefinition(badgeId);
  if (!definition) {
    return { granted: false, reason: "unknown_badge" };
  }

  const supabaseAdmin = createServiceRoleClient();

  const { data: existing } = await supabaseAdmin
    .from(USER_BADGES_TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();

  if (existing) {
    return { granted: false, reason: "already_earned" };
  }

  const { error: insertError } = await supabaseAdmin.from(USER_BADGES_TABLE).insert({
    user_id: userId,
    badge_id: badgeId,
    star_reward: definition.starReward,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { granted: false, reason: "already_earned" };
    }
    console.error("GRANT_BADGE_ERROR:", insertError.message);
    return { granted: false, reason: "db_error" };
  }

  try {
    const wallet = await creditBadgeStarReward(userId, definition.starReward);

    await logStarsLedgerEntry({
      profileId: userId,
      transactionType: ledgerType,
      starPointsDelta: definition.starReward,
      referenceId: badgeId,
      metadata: {
        badgeId,
        badgeName: definition.name,
        threshold: definition.threshold,
        rewardType: ledgerType === "MILESTONE_REWARD" ? "milestone" : "badge",
      },
    });

    return {
      granted: true,
      badge: toGrantedBadgePayload(definition),
      totalStarPoints: wallet.totalStarPoints,
    };
  } catch (error) {
    console.error("GRANT_BADGE_REWARD_ERROR:", error);
    return { granted: false, reason: "db_error" };
  }
}

/** @deprecated processFeedbackMilestones kullanın */
export async function grantEligibleBadges(
  userId: string,
  feedbackCount: number,
  rating = MIN_MILESTONE_RATING
): Promise<GrantedBadgePayload[]> {
  const { processFeedbackMilestones } = await import("@/lib/badges/reward-system.server");
  return processFeedbackMilestones({ profileId: userId, feedbackCount, rating });
}

export async function getUserBadgeState(userId: string): Promise<{
  feedbackCount: number;
  earnedBadges: Array<GrantedBadgePayload & { earnedAt: string }>;
  nextBadge: { name: string; remaining: number; threshold: number } | null;
}> {
  const supabaseAdmin = createServiceRoleClient();

  const [{ data: profile }, { data: badgeRows }] = await Promise.all([
    supabaseAdmin.from(PROFILES_TABLE).select("feedback_count").eq("id", userId).maybeSingle(),
    supabaseAdmin
      .from(USER_BADGES_TABLE)
      .select("badge_id, earned_at, star_reward")
      .eq("user_id", userId)
      .order("earned_at", { ascending: true }),
  ]);

  const feedbackCount = profile?.feedback_count ?? 0;
  const earnedMap = new Map(
    (badgeRows ?? []).map((row) => [row.badge_id as string, row.earned_at as string])
  );

  const earnedBadges = BADGE_DEFINITIONS.filter((badge) => earnedMap.has(badge.id)).map(
    (badge) => ({
      ...toGrantedBadgePayload(badge),
      earnedAt: earnedMap.get(badge.id) ?? new Date().toISOString(),
    })
  );

  const nextDefinition = BADGE_DEFINITIONS.find((badge) => !earnedMap.has(badge.id));
  const nextBadge = nextDefinition
    ? {
        name: nextDefinition.name,
        remaining: Math.max(0, nextDefinition.threshold - feedbackCount),
        threshold: nextDefinition.threshold,
      }
    : null;

  return { feedbackCount, earnedBadges, nextBadge };
}
