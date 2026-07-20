"use client";

import { useEffect } from "react";
import { getGlobalFeedbackStats } from "@/lib/actions/feedback";
import { SWR_KEYS } from "@/lib/auth/data-cache";
import { FEEDBACK_UPDATED_EVENT } from "@/lib/energy-events";
import { useQuery } from "@/hooks/useQuery";

export function useGlobalFeedbackStats() {
  const query = useQuery(SWR_KEYS.globalFeedbackStats, getGlobalFeedbackStats, {
    dedupingInterval: 120_000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    const refresh = () => {
      void query.mutate();
    };

    window.addEventListener(FEEDBACK_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(FEEDBACK_UPDATED_EVENT, refresh);
  }, [query.mutate]);

  return query;
}
