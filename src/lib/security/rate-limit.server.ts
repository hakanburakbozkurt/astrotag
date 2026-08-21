import "server-only";

/** Dakika başına AI isteği — kullanıcı + route prefix */
export const AI_RATE_LIMIT_MAX_REQUESTS = 20;
export const AI_RATE_LIMIT_WINDOW_MS = 60_000;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export type RateLimitResult =
  | { allowed: true; remaining: number; resetAt: number }
  | { allowed: false; retryAfterSec: number; resetAt: number };

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Basit in-memory rate limit (Vercel/Upstash entegrasyonu için iskelet).
 * Serverless'ta instance başına çalışır; prod için KV tabanlı sürüm eklenebilir.
 */
export function checkRateLimit(
  key: string,
  limit = AI_RATE_LIMIT_MAX_REQUESTS,
  windowMs = AI_RATE_LIMIT_WINDOW_MS
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > 10_000) {
    pruneExpiredBuckets(now);
  }

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function buildAiRateLimitKey(profileId: string, pathname: string): string {
  return `ai:${profileId}:${pathname}`;
}
