"use client";

import { memo, useMemo } from "react";
import type { PlanetId } from "@/lib/astrology/types";
import { zodiacDegreeToMarkerPercent } from "@/lib/astrology/chart-alignment";
import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";
import type { TransitPlanetSnapshot } from "@/lib/cosmic-radar/transit-snapshot";
import PlanetIcon from "./PlanetIcon";
import {
  CHART_VIEWBOX,
  PLANET_ICON_SIZE,
  PLANET_RADIUS,
} from "./constants";
import {
  PLANET_SYMBOLS,
  TRANSIT_RADIUS_OFFSET,
} from "./transit-overlay.constants";

interface WeeklyTransitMarkersProps {
  transits: TransitPlanetSnapshot[];
  ascendantDegree: number;
  selectedSign: ZodiacSign;
}

interface MarkerLayout {
  id: PlanetId;
  leftPct: number;
  topPct: number;
  inSelectedSign: boolean;
  zodiacDegree: number;
}

function WeeklyTransitMarkers({
  transits,
  ascendantDegree,
  selectedSign,
}: WeeklyTransitMarkersProps) {
  const markers = useMemo((): MarkerLayout[] => {
    const radius = PLANET_RADIUS + TRANSIT_RADIUS_OFFSET;

    return transits.map((planet) => {
      const { leftPct, topPct } = zodiacDegreeToMarkerPercent(
        planet.zodiacDegree,
        ascendantDegree,
        CHART_VIEWBOX,
        radius
      );

      return {
        id: planet.id as PlanetId,
        leftPct,
        topPct,
        zodiacDegree: planet.zodiacDegree,
        inSelectedSign: planet.signName === selectedSign,
      };
    });
  }, [transits, ascendantDegree, selectedSign]);

  return (
    <>
      {markers.map((marker) => (
        <div
          key={marker.id}
          className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full ${
            marker.inSelectedSign ? "ring-2 ring-cyan-400/70" : "ring-1 ring-cyan-500/35"
          }`}
          style={{
            left: `${marker.leftPct}%`,
            top: `${marker.topPct}%`,
            width: PLANET_ICON_SIZE + 8,
            height: PLANET_ICON_SIZE + 8,
          }}
          title={`${marker.zodiacDegree.toFixed(1)}°`}
        >
          <PlanetIcon id={marker.id} size={PLANET_ICON_SIZE} className="text-cyan-300" />
          <span className="mt-0.5 text-[7px] font-medium text-cyan-200/90 sm:text-[8px]">
            {PLANET_SYMBOLS[marker.id]}
          </span>
        </div>
      ))}
    </>
  );
}

export default memo(WeeklyTransitMarkers, (prev, next) => {
  return (
    prev.transits === next.transits &&
    prev.ascendantDegree === next.ascendantDegree &&
    prev.selectedSign === next.selectedSign
  );
});
