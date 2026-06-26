import type { SWRConfiguration } from "swr";
import type { SynastryScoreResponse } from "@/lib/ai/synastry";
import { fetchSynastryScore } from "@/lib/ai/synastry-client";
import { buildSynastryScoreFingerprint } from "@/lib/synastry/synastry-score-engine";
import type { NexusDailyResponse } from "@/lib/ai/nexus";
import { fetchNexusDaily } from "@/lib/ai/nexus-client";
import type { UserData } from "@/types/user";

export const SWR_KEYS = {
  session: "nfc/session",
  profile: "user/profile",
  synastryScore: (profileId: string, dateKey: string, partnerFingerprint: string) =>
    ["synastry/score", profileId, dateKey, partnerFingerprint] as const,
  nexusDaily: (profileId: string, dateKey: string) =>
    ["nexus/daily", profileId, dateKey] as const,
} as const;

/** stale-while-revalidate — arka planda tazelerken cache göster */
export const SWR_DEFAULT_OPTIONS: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60_000,
  keepPreviousData: true,
  errorRetryCount: 2,
};

export async function fetchSynastryScoreCached(
  userData: UserData
): Promise<SynastryScoreResponse> {
  return fetchSynastryScore(userData);
}

export async function fetchNexusDailyCached(
  userData: UserData
): Promise<NexusDailyResponse> {
  return fetchNexusDaily(userData);
}
