import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";

const TAROT_HISTORY_TABLE = "tarot_history";

export async function getCachedOracleJsonResponse<T>(
  profileId: string,
  cacheSignature: string
): Promise<T | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from(TAROT_HISTORY_TABLE)
    .select("reading")
    .eq("user_id", profileId)
    .eq("card_signature", cacheSignature)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[oracle-cache] read failed:", error.message, cacheSignature);
    return null;
  }

  const raw = data?.reading?.trim();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    console.error("[oracle-cache] invalid JSON:", cacheSignature);
    return null;
  }
}

export async function saveCachedOracleJsonResponse(
  profileId: string,
  cacheSignature: string,
  question: string,
  payload: unknown
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TAROT_HISTORY_TABLE).insert({
    user_id: profileId,
    question,
    card_ids: [],
    card_signature: cacheSignature,
    reading: JSON.stringify(payload),
  });

  if (error) {
    console.error("[oracle-cache] save failed:", error.message, cacheSignature);
  }
}

export function nexusDailyCacheSignature(dateKey: string): string {
  return `nexus-daily-v1:${dateKey}`;
}

export function synastryScoreCacheSignature(
  dateKey: string,
  partnerFingerprint: string
): string {
  return `synastry-score-v1:${dateKey}:${partnerFingerprint}`;
}
