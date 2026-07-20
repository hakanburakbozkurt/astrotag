"use client";

import { useEffect } from "react";
import {
  getGlobalFeedbackStats,
  type GlobalFeedbackStats,
} from "@/lib/actions/feedback";
import { EMPTY_GLOBAL_FEEDBACK_STATS } from "@/lib/feedback/global-feedback-stats.shared";
import { SWR_KEYS } from "@/lib/auth/data-cache";
import { FEEDBACK_UPDATED_EVENT } from "@/lib/energy-events";
import { useQuery } from "@/hooks/useQuery";

async function fetchGlobalFeedbackStatsSafe(): Promise<GlobalFeedbackStats> {
  try {
    return await getGlobalFeedbackStats();
  } catch (error) {
    console.error("[useGlobalFeedbackStats]", error);
    return EMPTY_GLOBAL_FEEDBACK_STATS;
  }
}

export function useGlobalFeedbackStats() {
  const query = useQuery(
    SWR_KEYS.globalFeedbackStats,
    fetchGlobalFeedbackStatsSafe,
    {
      dedupingInterval: 120_000,
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      keepPreviousData: true,
      fallbackData: EMPTY_GLOBAL_FEEDBACK_STATS,
    }
  );

  useEffect(() => {
    const refresh = () => {
      void query.mutate();
    };

    window.addEventListener(FEEDBACK_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(FEEDBACK_UPDATED_EVENT, refresh);
  }, [query.mutate]);

  return query;
}
