"use client";

import { useCallback, useState } from "react";
import { STAR_POINTS_UPDATED_EVENT } from "@/lib/energy-events";
import { consumeStarPoints } from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { useStarEconomy } from "@/hooks/useStarEconomy";

export function usePaidAnalysis() {
  const { totalStarPoints, refresh } = useStarEconomy();
  const [detailsUnlocked, setDetailsUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const resetUnlock = useCallback(() => {
    setDetailsUnlocked(false);
    setUnlockError(null);
  }, []);

  const unlockDetails = useCallback(
    async (cost: number) => {
      if (detailsUnlocked || isUnlocking) {
        return;
      }

      if (cost <= 0) {
        setDetailsUnlocked(true);
        setUnlockError(null);
        return;
      }

      if (totalStarPoints < cost) {
        setUnlockError(
          `Detaylar için ${cost} yıldız gerekir. Mevcut: ${totalStarPoints}`
        );
        return;
      }

      setIsUnlocking(true);
      setUnlockError(null);

      try {
        const remaining = await consumeStarPoints(cost);
        window.dispatchEvent(
          new CustomEvent(STAR_POINTS_UPDATED_EVENT, {
            detail: { starPoints: remaining },
          })
        );
        void refresh();
        setDetailsUnlocked(true);
      } catch (err) {
        setUnlockError(
          err instanceof SupabaseActionError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Yıldız harcanamadı. Lütfen tekrar deneyin."
        );
      } finally {
        setIsUnlocking(false);
      }
    },
    [detailsUnlocked, isUnlocking, refresh, totalStarPoints]
  );

  return {
    totalStarPoints,
    detailsUnlocked,
    isUnlocking,
    unlockError,
    unlockDetails,
    resetUnlock,
  };
}
