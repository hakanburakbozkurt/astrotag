import "server-only";

import {
  BADGE_DEFINITIONS,
  getBadgeDefinition,
  toGrantedBadgePayload,
  type GrantedBadgePayload,
} from "@/lib/badges/badge-definitions";
import { logStarsLedgerEntry } from "@/lib/stars/stars-ledger.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const PROFILES_TABLE = "profiles";
const USER_BADGES_TABLE = "user_badges";

export type GrantBadgeResult =
  | { granted: true; badge: GrantedBadgePayload; totalStarPoints: number }
  | { granted: false; reason: "unknown_badge" | "already_earned" | "db_error" };

async function creditBadgeStarReward(
  userId: string,
  amount: number
): Promise<{ starPoints: number; starPointsBonus: number; totalStarPoints: number }> {
  const supabase = createSupabaseServiceClient();

  const { data, error: readError } = await supabase
    .from(PROFILES_TABLE)
    .select("star_points, star_points_bonus")
    .eq("id", userId)
    .maybeSingle();

  if (readError || !data) {
    throw new Error("Rozet ödülü için profil okunamadı.");
  }

  const starPoints = data.star_points ?? 0;
  const starPointsBonus = (data.star_points_bonus ?? 0) + amount;

  const { error: updateError } = await supabase
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
  badgeId: string
): Promise<GrantBadgeResult> {
  const definition = getBadgeDefinition(badgeId);
  if (!definition) {
    return { granted: false, reason: "unknown_badge" };
  }

  const supabase = createSupabaseServiceClient();

  const { data: existing } = await supabase
    .from(USER_BADGES_TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();

  if (existing) {
    return { granted: false, reason: "already_earned" };
  }

  const { error: insertError } = await supabase.from(USER_BADGES_TABLE).insert({
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
      userId,
      transactionType: "BADGE_REWARD",
      starPointsDelta: definition.starReward,
      referenceId: badgeId,
      metadata: {
        badgeId,
        badgeName: definition.name,
        threshold: definition.threshold,
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

/** feedback_count eşiğine ulaşılan tüm rozetleri dene */
export async function grantEligibleBadges(
  userId: string,
  feedbackCount: number
): Promise<GrantedBadgePayload[]> {
  const granted: GrantedBadgePayload[] = [];

  for (const definition of BADGE_DEFINITIONS) {
    if (feedbackCount < definition.threshold) {
      continue;
    }

    const result = await grantBadge(userId, definition.id);
    if (result.granted) {
      granted.push(result.badge);
    }
  }

  return granted;
}

export async function getUserBadgeState(userId: string): Promise<{
  feedbackCount: number;
  earnedBadges: Array<GrantedBadgePayload & { earnedAt: string }>;
  nextBadge: { name: string; remaining: number; threshold: number } | null;
}> {
  const supabase = createSupabaseServiceClient();

  const [{ data: profile }, { data: badgeRows }] = await Promise.all([
    supabase.from(PROFILES_TABLE).select("feedback_count").eq("id", userId).maybeSingle(),
    supabase
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
