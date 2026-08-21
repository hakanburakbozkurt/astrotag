import type { SWRConfiguration } from "swr";
import { fetchSynastryScore } from "@/lib/ai/synastry-client";
import type { NexusDailyResponse } from "@/lib/ai/nexus";
import { fetchNexusDaily } from "@/lib/ai/nexus-client";
import {
  QUERY_RETRY_COUNT,
  QUERY_RETRY_DELAY_MS,
} from "@/lib/query/fetch-with-retry";

export const SWR_KEYS = {
  session: "nfc/session",
  profile: "user/profile",
  starPoints: "user/star-points",
  wallet: "user/wallet",
  badgeProgress: "user/badge-progress",
  globalFeedbackStats: "social/global-feedback-stats",
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

export async function fetchSynastryScoreCached() {
  return fetchSynastryScore();
}

export async function fetchNexusDailyCached(): Promise<NexusDailyResponse> {
  return fetchNexusDaily();
}
