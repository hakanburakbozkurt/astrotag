import "server-only";

import {
  FEED_DAILY_LIKE_LIMIT_MESSAGE,
  USER_DAILY_LIKE_LIMIT,
  USER_DAILY_POST_LIMIT,
} from "@/lib/feed/feed-context-tags.shared";
import { createServiceRoleClient } from "@/lib/supabase/service";

const ISTANBUL_TZ = "Europe/Istanbul";

function getIstanbulDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function countUserPostsForIstanbulDay(
  profileId: string,
  dateKey = getIstanbulDateKey()
): Promise<number> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("expert_feed")
    .select("id, created_at")
    .eq("user_profile_id", profileId)
    .eq("content_type", "user_post");

  if (error || !data) {
    return 0;
  }

  return data.filter((row) => {
    const key = getIstanbulDateKey(new Date(row.created_at));
    return key === dateKey;
  }).length;
}

export async function assertUserDailyPostLimit(
  profileId: string
): Promise<{ ok: true; remaining: number } | { ok: false; error: string }> {
  const used = await countUserPostsForIstanbulDay(profileId);
  if (used >= USER_DAILY_POST_LIMIT) {
    return {
      ok: false,
      error: `Günlük gönderi limitine ulaştınız (${USER_DAILY_POST_LIMIT}/gün).`,
    };
  }

  return { ok: true, remaining: USER_DAILY_POST_LIMIT - used };
}

export async function countUserLikesForIstanbulDay(
  profileId: string,
  dateKey = getIstanbulDateKey()
): Promise<number> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("feed_likes")
    .select("id, created_at")
    .eq("profile_id", profileId);

  if (error || !data) {
    return 0;
  }

  return data.filter((row) => {
    const key = getIstanbulDateKey(new Date(row.created_at));
    return key === dateKey;
  }).length;
}

export async function assertUserDailyLikeLimit(
  profileId: string
): Promise<{ ok: true; remaining: number } | { ok: false; error: string }> {
  const used = await countUserLikesForIstanbulDay(profileId);
  if (used >= USER_DAILY_LIKE_LIMIT) {
    return { ok: false, error: FEED_DAILY_LIKE_LIMIT_MESSAGE };
  }

  return { ok: true, remaining: USER_DAILY_LIKE_LIMIT - used };
}
