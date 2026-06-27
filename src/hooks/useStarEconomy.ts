"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildStarPointsChargeState,
  type StarPointsChargeState,
} from "@/lib/energy-charge";
import { STAR_POINTS_UPDATED_EVENT } from "@/lib/energy-events";
import {
  applyOptimisticStarClaim,
  getStarClaimButtonLabel,
  getStarFillPercent,
} from "@/lib/star-economy/compute";
import {
  mergeLastClaimed,
  readLocalLastClaimed,
  writeLocalLastClaimed,
} from "@/lib/star-economy/storage";
import { chargeStarPoints, getStarPointsChargeState } from "@/lib/supabase-actions";
import { formatCountdown, SupabaseActionError } from "@/lib/supabase-action-error";

const EMPTY_CHARGE_STATE: StarPointsChargeState = {
  starPoints: 0,
  starPointsBonus: 0,
  totalStarPoints: 0,
  lastStarPointsCharge: null,
  canCharge: false,
  isFull: false,
  nextChargeAt: null,
};

function buildChargeStateFromLastClaimed(
  starPoints: number,
  starPointsBonus: number,
  lastClaimed: string | null
): StarPointsChargeState {
  return buildStarPointsChargeState(starPoints, starPointsBonus, lastClaimed);
}

export function useStarEconomy() {
  const [chargeState, setChargeState] = useState<StarPointsChargeState>(() => {
    const localLastClaimed = readLocalLastClaimed();
    if (!localLastClaimed) {
      return EMPTY_CHARGE_STATE;
    }

    return buildChargeStateFromLastClaimed(0, 0, localLastClaimed);
  });
  const [countdown, setCountdown] = useState("00:00:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isClaimingRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const serverState = await getStarPointsChargeState();
      const mergedLastClaimed = mergeLastClaimed(
        serverState.lastStarPointsCharge,
        readLocalLastClaimed()
      );

      const nextState = buildChargeStateFromLastClaimed(
        serverState.starPoints,
        serverState.starPointsBonus,
        mergedLastClaimed
      );

      setChargeState(nextState);

      if (mergedLastClaimed) {
        writeLocalLastClaimed(mergedLastClaimed);
      }
    } catch (err) {
      const message =
        err instanceof SupabaseActionError
          ? err.message
          : "Yıldız puanı bilgisi alınamadı.";
      setError(message);
      setChargeState(EMPTY_CHARGE_STATE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleStarPointsUpdated = () => {
      if (isClaimingRef.current) {
        return;
      }
      void refresh();
    };

    window.addEventListener(STAR_POINTS_UPDATED_EVENT, handleStarPointsUpdated);
    return () => {
      window.removeEventListener(STAR_POINTS_UPDATED_EVENT, handleStarPointsUpdated);
    };
  }, [refresh]);

  useEffect(() => {
    if (!chargeState.nextChargeAt) {
      setCountdown("00:00:00");
      return;
    }

    const updateCountdown = () => {
      const remaining = formatCountdown(chargeState.nextChargeAt);
      setCountdown(remaining);

      if (remaining === "00:00:00") {
        void refresh();
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [chargeState.nextChargeAt, refresh]);

  const claimStars = useCallback(async () => {
    if (isClaiming || !chargeState.canCharge) {
      return;
    }

    const previousState = chargeState;
    const optimisticState = applyOptimisticStarClaim(chargeState);
    const optimisticLastClaimed = optimisticState.lastStarPointsCharge;

    setIsClaiming(true);
    isClaimingRef.current = true;
    setError(null);
    setChargeState(optimisticState);

    if (optimisticLastClaimed) {
      writeLocalLastClaimed(optimisticLastClaimed);
    }

    try {
      const result = await chargeStarPoints();
      setChargeState(result.chargeState);

      if (result.chargeState.lastStarPointsCharge) {
        writeLocalLastClaimed(result.chargeState.lastStarPointsCharge);
      }

      window.dispatchEvent(
        new CustomEvent(STAR_POINTS_UPDATED_EVENT, {
          detail: { starPoints: result.chargeState.totalStarPoints },
        })
      );
    } catch (err) {
      setChargeState(previousState);

      if (previousState.lastStarPointsCharge) {
        writeLocalLastClaimed(previousState.lastStarPointsCharge);
      }

      if (
        err instanceof SupabaseActionError &&
        (err.message.includes("beklemelisiniz") || err.message.includes("dolu"))
      ) {
        setError(err.message);
      }
    } finally {
      isClaimingRef.current = false;
      setIsClaiming(false);
    }
  }, [chargeState, isClaiming]);

  const isOnCooldown = Boolean(chargeState.nextChargeAt);

  return {
    starPoints: chargeState.starPoints,
    starPointsBonus: chargeState.starPointsBonus,
    totalStarPoints: chargeState.totalStarPoints,
    canCharge: chargeState.canCharge,
    isFull: chargeState.isFull,
    nextChargeAt: chargeState.nextChargeAt,
    lastClaimed: chargeState.lastStarPointsCharge,
    countdown,
    isOnCooldown,
    fillPercent: getStarFillPercent(chargeState.starPoints),
    isLoading,
    isClaiming,
    error,
    refresh,
    claimStars,
    buttonLabel: getStarClaimButtonLabel({
      isClaiming,
      isFull: chargeState.isFull,
      isOnCooldown,
      countdown,
    }),
  };
}
