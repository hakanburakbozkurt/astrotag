"use client";

import { memo, useEffect, useMemo } from "react";
import { validateAscendantScreenAlignment } from "@/lib/astrology/chart-alignment";
import type { NatalChartData } from "@/lib/astrology/types";
import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";
import { getSignAscendantDegree } from "@/lib/cosmic-radar/sign-ascendant";
import type { TransitPlanetSnapshot } from "@/lib/cosmic-radar/transit-snapshot";
import ChartEngine from "./ChartEngine";
import WeeklyTransitMarkers from "./WeeklyTransitMarkers";

interface WeeklyAnalysisChartProps {
  natalChart: NatalChartData;
  transits: TransitPlanetSnapshot[];
  selectedSign: ZodiacSign;
}

function WeeklyAnalysisChart({
  natalChart,
  transits,
  selectedSign,
}: WeeklyAnalysisChartProps) {
  const selectedSignAscendantDegree = useMemo(
    () => getSignAscendantDegree(selectedSign),
    [selectedSign]
  );

  useEffect(() => {
    validateAscendantScreenAlignment(selectedSign, selectedSignAscendantDegree);
  }, [selectedSign, selectedSignAscendantDegree]);

  const transitOverlay = useMemo(
    () => (
      <WeeklyTransitMarkers
        transits={transits}
        ascendantDegree={selectedSignAscendantDegree}
        selectedSign={selectedSign}
      />
    ),
    [transits, selectedSignAscendantDegree, selectedSign]
  );

  return (
    <ChartEngine
      data={natalChart}
      viewMode="classic"
      ascendantDegree={selectedSignAscendantDegree}
      ariaLabel="Haftalık transit haritası"
      overlay={transitOverlay}
    />
  );
}

export default memo(
  WeeklyAnalysisChart,
  (prev, next) =>
    prev.natalChart === next.natalChart &&
    prev.transits === next.transits &&
    prev.selectedSign === next.selectedSign
);
