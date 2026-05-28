"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserData } from "@/types/user";
import {
  computeNatalChart,
  resolveBirthContext,
} from "@/lib/astrology/planet-positions";
import type { BirthContext, NatalChartData } from "@/lib/astrology/types";

export type NatalChartStatus = "idle" | "loading" | "ready" | "error";

export interface UseNatalChartResult {
  status: NatalChartStatus;
  data: NatalChartData | null;
  error: string | null;
}

export function useNatalChart(userData: UserData | null): UseNatalChartResult {
  const [status, setStatus] = useState<NatalChartStatus>("idle");
  const [context, setContext] = useState<BirthContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.birthDate || !userData?.birthTime || !userData?.birthPlace) {
      setStatus("error");
      setContext(null);
      setError("Doğum bilgileri eksik.");
      return;
    }

    let cancelled = false;

    async function loadContext() {
      setStatus("loading");
      setError(null);

      try {
        const birthContext = await resolveBirthContext({
          birthDate: userData!.birthDate,
          birthTime: userData!.birthTime,
          birthPlace: userData!.birthPlace,
        });

        if (cancelled) return;
        setContext(birthContext);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setContext(null);
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Harita hesaplanamadı."
        );
      }
    }

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [userData?.birthDate, userData?.birthTime, userData?.birthPlace]);

  const data = useMemo(() => {
    if (!context) return null;
    return computeNatalChart(context);
  }, [
    context?.birthUtc.getTime(),
    context?.coordinates.latitude,
    context?.coordinates.longitude,
    context?.coordinates.timezone,
    context,
  ]);

  return { status, data, error };
}
