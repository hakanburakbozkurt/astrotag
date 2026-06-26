"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserData } from "@/types/user";
import {
  computeNatalChart,
  resolveBirthContext,
} from "@/lib/astrology/planet-positions";
import { sunSignFromBirthDate } from "@/lib/astrology/sun-sign";
import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";
import { ZODIAC_SIGNS } from "@/lib/astrology/zodiac";
import { buildWeeklyAnalysis } from "@/lib/cosmic-radar/cosmic-radar-engine";
import { snapshotTransitPlanets } from "@/lib/cosmic-radar/transit-snapshot";
import type { WeeklyAnalysisContent } from "@/lib/cosmic-radar/types";
import type { NatalChartData } from "@/lib/astrology/types";
import { ORACLE_COSMIC_DATA_ERROR, logOracleModuleError } from "@/lib/oracle/oracle-errors";

export type WeeklyAnalysisStatus = "idle" | "loading" | "ready" | "error";

export interface UseWeeklyAnalysisResult {
  status: WeeklyAnalysisStatus;
  content: WeeklyAnalysisContent | null;
  natalChart: NatalChartData | null;
  transits: ReturnType<typeof snapshotTransitPlanets>;
  selectedSign: ZodiacSign;
  setSelectedSign: (sign: ZodiacSign) => void;
  error: string | null;
}

export function useWeeklyAnalysis(userData: UserData | null): UseWeeklyAnalysisResult {
  const defaultSign =
    (sunSignFromBirthDate(userData?.birthDate) as ZodiacSign | null) ??
    ZODIAC_SIGNS[0];

  const [status, setStatus] = useState<WeeklyAnalysisStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedSign, setSelectedSign] = useState<ZodiacSign>(defaultSign);
  const [natalReady, setNatalReady] = useState(false);
  const [natalChart, setNatalChart] = useState<
    ReturnType<typeof computeNatalChart> | null
  >(null);

  useEffect(() => {
    const sign =
      (sunSignFromBirthDate(userData?.birthDate) as ZodiacSign | null) ??
      ZODIAC_SIGNS[0];
    setSelectedSign(sign);
  }, [userData?.birthDate]);

  useEffect(() => {
    if (!userData?.birthDate || !userData?.birthTime || !userData?.birthPlace) {
      setStatus("error");
      setError("Doğum bilgileri eksik.");
      setNatalChart(null);
      setNatalReady(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError(null);
      setNatalReady(false);

      try {
        const context = await resolveBirthContext({
          birthDate: userData!.birthDate,
          birthTime: userData!.birthTime,
          birthPlace: userData!.birthPlace,
        });

        if (cancelled) return;

        const chart = computeNatalChart(context);
        setNatalChart(chart);
        setNatalReady(true);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setNatalChart(null);
        setNatalReady(false);
        setStatus("error");
        logOracleModuleError("cosmic-radar", err, {
          birthPlace: userData!.birthPlace,
        });
        setError(ORACLE_COSMIC_DATA_ERROR);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userData?.birthDate, userData?.birthTime, userData?.birthPlace]);

  const content = useMemo(() => {
    if (!natalReady || !natalChart) return null;
    return buildWeeklyAnalysis({
      natalChart,
      selectedSign,
    });
  }, [natalReady, natalChart, selectedSign]);

  const transits = useMemo(() => {
    if (!natalReady) return [];
    return snapshotTransitPlanets(new Date());
  }, [natalReady, natalChart]);

  return {
    status,
    content,
    natalChart,
    transits,
    selectedSign,
    setSelectedSign,
    error,
  };
}

/** @deprecated useWeeklyAnalysis kullanın */
export const useCosmicRadar = useWeeklyAnalysis;
