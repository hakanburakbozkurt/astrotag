import "server-only";

import {
  deserializeOraclePresentation,
  serializeOraclePresentation,
} from "@/lib/analysis/presentation-storage";
import type { OracleAnalysisPresentation } from "@/lib/analysis/types";
import { NATAL_INTERPRETATION_CACHE_HOURS } from "@/lib/constants/cosmic";
import { createServiceRoleClient } from "@/lib/supabase/service";

const TAROT_HISTORY_TABLE = "tarot_history";
const NATAL_CACHE_SIGNATURE = "natal-interpretation-v1";

const CACHE_PRESENTATION_OPTIONS = {
  cost: 0,
  isPremium: false,
} as const;

export async function getCachedNatalInterpretation(
  profileId: string
): Promise<OracleAnalysisPresentation | null> {
  const supabase = createServiceRoleClient();
  const since = new Date(
    Date.now() - NATAL_INTERPRETATION_CACHE_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from(TAROT_HISTORY_TABLE)
    .select("reading")
    .eq("user_id", profileId)
    .eq("card_signature", NATAL_CACHE_SIGNATURE)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[natal-cache] read failed:", error.message);
    return null;
  }

  const raw = data?.reading?.trim();
  if (!raw) {
    return null;
  }

  return deserializeOraclePresentation(raw, CACHE_PRESENTATION_OPTIONS);
}

export async function saveCachedNatalInterpretation(
  profileId: string,
  presentation: Pick<OracleAnalysisPresentation, "executiveSummary" | "details">
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TAROT_HISTORY_TABLE).insert({
    user_id: profileId,
    question: "Natal chart interpretation cache",
    card_ids: [],
    card_signature: NATAL_CACHE_SIGNATURE,
    reading: serializeOraclePresentation(presentation),
  });

  if (error) {
    console.error("[natal-cache] save failed:", error.message);
  }
}
