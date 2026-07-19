"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SWR_KEYS } from "@/lib/auth/data-cache";
import { useQuery } from "@/hooks/useQuery";

const EMPTY_CHARGE_STATE: StarPointsChargeState = {
  starPoints: 0,
  starPointsBonus: 0,
  totalStarPoints: 0,
  lastStarPointsCharge: null,
  canCharge: false,
  isFull: false,
  nextChargeAt: null,
};

function buildChargeStateFromServer(
  serverState: StarPointsChargeState
): StarPointsChargeState {
  const mergedLastClaimed = mergeLastClaimed(
    serverState.lastStarPointsCharge,
    readLocalLastClaimed()
  );

  return buildStarPointsChargeState(
    serverState.starPoints,
    serverState.starPointsBonus,
    mergedLastClaimed
  );
}

export function useStarEconomy() {
  const {
    data: serverState,
    isPending,
    showError,
    error,
    mutate,
  } = useQuery(SWR_KEYS.starPoints, getStarPointsChargeState);

  const [countdown, setCountdown] = useState("00:00:00");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const isClaimingRef = useRef(false);

  const chargeState = useMemo(() => {
    if (!serverState) {
      const localLastClaimed = readLocalLastClaimed();
      if (!localLastClaimed) {
        return EMPTY_CHARGE_STATE;
      }

      return buildStarPointsChargeState(0, 0, localLastClaimed);
    }

    return buildChargeStateFromServer(serverState);
  }, [serverState]);

  useEffect(() => {
    if (serverState?.lastStarPointsCharge) {
      const mergedLastClaimed = mergeLastClaimed(
        serverState.lastStarPointsCharge,
        readLocalLastClaimed()
      );
      if (mergedLastClaimed) {
        writeLocalLastClaimed(mergedLastClaimed);
      }
    }
  }, [serverState]);

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

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
    setClaimError(null);

    if (optimisticLastClaimed) {
      writeLocalLastClaimed(optimisticLastClaimed);
    }

    try {
      const result = await chargeStarPoints();
      await mutate(result.chargeState, { revalidate: false });

      if (result.chargeState.lastStarPointsCharge) {
        writeLocalLastClaimed(result.chargeState.lastStarPointsCharge);
      }

      window.dispatchEvent(
        new CustomEvent(STAR_POINTS_UPDATED_EVENT, {
          detail: { starPoints: result.chargeState.totalStarPoints },
        })
      );
    } catch (err) {
      if (previousState.lastStarPointsCharge) {
        writeLocalLastClaimed(previousState.lastStarPointsCharge);
      }

      if (
        err instanceof SupabaseActionError &&
        (err.message.includes("beklemelisiniz") || err.message.includes("dolu"))
      ) {
        setClaimError(err.message);
      }
    } finally {
      isClaimingRef.current = false;
      setIsClaiming(false);
    }
  }, [chargeState, isClaiming, mutate]);

  const isOnCooldown = Boolean(chargeState.nextChargeAt);
  const queryError =
    showError && error
      ? error instanceof SupabaseActionError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Yıldız puanı bilgisi alınamadı."
      : null;

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
    isLoading: isPending,
    isPending,
    isClaiming,
    error: claimError ?? queryError,
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
