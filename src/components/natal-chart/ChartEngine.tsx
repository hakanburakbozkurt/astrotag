"use client";

import { memo, useMemo, type ReactNode } from "react";
import type { NatalChartData, NatalChartViewMode } from "@/lib/astrology/types";
import { resolvePlanetRadiusOffsets } from "@/lib/astrology/planet-offset";
import ZodiacWheel from "./ZodiacWheel";
import AspectLines from "./AspectLines";
import PlanetMarkers from "./PlanetMarkers";
import { CHART_VIEWBOX } from "./constants";

export interface ChartEngineProps {
  data: NatalChartData;
  viewMode?: NatalChartViewMode;
  /**
   * Harita perspektifi yükseleni (0–360).
   * Verilmezse doğum haritası ASC — natal sayfa davranışı değişmez.
   */
  ascendantDegree?: number;
  ariaLabel?: string;
  /** Transit vb. üst katman overlay (PlanetMarkers ile aynı koordinat sistemi). */
  overlay?: ReactNode;
}

function ChartEngine({
  data,
  viewMode = "classic",
  ascendantDegree,
  ariaLabel = "Doğum haritası",
  overlay,
}: ChartEngineProps) {
  const perspectiveAsc = ascendantDegree ?? data.ascendant.longitude;

  const radiusOffsets = useMemo(
    () => resolvePlanetRadiusOffsets(data.planets),
    [data.planets]
  );

  const chartBodies = useMemo(
    () =>
      data.planets.map((planet) => ({
        id: planet.id,
        longitude: planet.longitude,
      })),
    [data.planets]
  );

  return (
    <div className="relative aspect-square w-full">
      <svg
        viewBox={`0 0 ${CHART_VIEWBOX} ${CHART_VIEWBOX}`}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: "none" }}
        role="img"
        aria-label={ariaLabel}
        preserveAspectRatio="xMidYMid meet"
      >
        <ZodiacWheel
          ascendant={perspectiveAsc}
          mode={viewMode}
          houses={data.houses}
        />
        <AspectLines
          bodies={chartBodies}
          aspects={data.aspects}
          ascendant={perspectiveAsc}
          radiusOffsets={radiusOffsets}
          useExtendedColors={false}
        />
      </svg>

      <PlanetMarkers
        planets={data.planets}
        ascendant={perspectiveAsc}
        radiusOffsets={radiusOffsets}
        activePlanetId={null}
        onPlanetTap={() => undefined}
      />

      {overlay ? (
        <div className="pointer-events-none absolute inset-0 z-[2]">{overlay}</div>
      ) : null}
    </div>
  );
}

export default memo(ChartEngine, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.viewMode === next.viewMode &&
    prev.ascendantDegree === next.ascendantDegree &&
    prev.ariaLabel === next.ariaLabel &&
    prev.overlay === next.overlay
  );
});
