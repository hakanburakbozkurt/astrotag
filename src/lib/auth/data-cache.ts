import type { SWRConfiguration } from "swr";
import type { SynastryScoreResponse } from "@/lib/ai/synastry";
import { fetchSynastryScore } from "@/lib/ai/synastry-client";
import { buildSynastryScoreFingerprint } from "@/lib/synastry/synastry-score-engine";
import type { NexusDailyResponse } from "@/lib/ai/nexus";
import { fetchNexusDaily } from "@/lib/ai/nexus-client";
import type { UserData } from "@/types/user";
import {
  QUERY_RETRY_COUNT,
  QUERY_RETRY_DELAY_MS,
} from "@/lib/query/fetch-with-retry";

export const SWR_KEYS = {
  session: "nfc/session",
  profile: "user/profile",
  starPoints: "user/star-points",
  badgeProgress: "user/badge-progress",
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
  errorRetryCount: QUERY_RETRY_COUNT,
  errorRetryInterval: QUERY_RETRY_DELAY_MS,
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
