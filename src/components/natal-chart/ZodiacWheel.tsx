"use client";

import { useEffect, useRef } from "react";
import type { NatalChartViewMode } from "@/lib/astrology/types";
import { ZODIAC_SIGNS, signMidpointLongitude } from "@/lib/astrology/zodiac";
import {
  auditZodiacWheelDirection,
  engineDegreeToWheelLocalAngle,
} from "@/lib/astrology/chart-alignment";
import { toChartLongitude } from "@/lib/astrology/chart-geometry";
import type { HouseCusp } from "@/lib/astrology/types";
import {
  ASC_MARKER_OFFSET,
  CHART_CENTER,
  CHART_VIEWBOX,
  INNER_RADIUS,
  OUTER_RADIUS,
} from "./constants";

const HOUSE_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

interface ZodiacWheelProps {
  ascendant: number;
  mode?: NatalChartViewMode;
  houses?: HouseCusp[];
  /** false ise ASC oku/çizgisi çizilmez (dış katmanda sabit eksen için). */
  showAscMarker?: boolean;
  /** Geliştirme: tekerlek geometri denetimi */
  debug?: boolean;
}

export default function ZodiacWheel({
  ascendant,
  mode = "classic",
  houses = [],
  showAscMarker = true,
  debug = false,
}: ZodiacWheelProps) {
  const rootRef = useRef<SVGGElement>(null);
  const isMaster = mode === "master";
  const degreeRingRadius = OUTER_RADIUS - 8;
  const tickOuter = OUTER_RADIUS + (isMaster ? 4 : 0);
  const tickInnerMajor = INNER_RADIUS + (isMaster ? 6 : 0);
  const signTicks = ZODIAC_SIGNS.map((sign, index) => {
    const cuspLongitude = index * 30;
    const labelLongitude = signMidpointLongitude(index);
    const cuspChart = toChartLongitude(cuspLongitude, ascendant);
    const labelChart = toChartLongitude(labelLongitude, ascendant);
    const cuspRadians = ((90 - cuspChart) * Math.PI) / 180;
    const labelRadians = ((90 - labelChart) * Math.PI) / 180;
    const x1 = CHART_CENTER + INNER_RADIUS * Math.cos(cuspRadians);
    const y1 = CHART_CENTER - INNER_RADIUS * Math.sin(cuspRadians);
    const x2 = CHART_CENTER + OUTER_RADIUS * Math.cos(cuspRadians);
    const y2 = CHART_CENTER - OUTER_RADIUS * Math.sin(cuspRadians);
    const labelRadius = OUTER_RADIUS + 12;
    const labelX = CHART_CENTER + labelRadius * Math.cos(labelRadians);
    const labelY = CHART_CENTER - labelRadius * Math.sin(labelRadians);

    return { sign, x1, y1, x2, y2, labelX, labelY };
  });

  const ascLeft = CHART_CENTER - OUTER_RADIUS - ASC_MARKER_OFFSET;
  const ascArrowTip = CHART_CENTER - OUTER_RADIUS + 8;

  useEffect(() => {
    if (!debug || process.env.NODE_ENV === "production") {
      return;
    }

    const element = rootRef.current;
    if (!element) {
      return;
    }

    const parent = element.parentElement;
    const firstThreeSignAngles = ZODIAC_SIGNS.slice(0, 3).map((sign, index) => ({
      sign,
      cuspDegree: index * 30,
      wheelLocalAngle: engineDegreeToWheelLocalAngle(index * 30),
      chartAngle: toChartLongitude(index * 30, ascendant),
    }));

    console.log("Wheel-Debug:", {
      rotation: parent?.getAttribute("transform") ?? element.style.transform,
      origin: `${CHART_CENTER}, ${CHART_CENTER}`,
      transformOrigin: parent
        ? `${CHART_CENTER}px ${CHART_CENTER}px (svg rotate center, not CSS)`
        : "center center",
      childCount: element.children.length,
      viewBox: CHART_VIEWBOX,
      chartCenter: CHART_CENTER,
      outerRadius: OUTER_RADIUS,
      radiusNormalizedToViewBox: OUTER_RADIUS / CHART_VIEWBOX,
      zodiacDirection: auditZodiacWheelDirection(),
      firstThreeSignAngles,
    });
  }, [ascendant, debug, signTicks.length]);

  return (
    <g ref={rootRef}>
      <circle
        cx={CHART_CENTER}
        cy={CHART_CENTER}
        r={OUTER_RADIUS}
        fill="none"
        stroke={isMaster ? "rgba(251,191,36,0.45)" : "rgba(251,191,36,0.35)"}
        strokeWidth={isMaster ? 1.75 : 1.5}
      />
      {isMaster ? (
        <circle
          cx={CHART_CENTER}
          cy={CHART_CENTER}
          r={degreeRingRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ) : null}
      <circle
        cx={CHART_CENTER}
        cy={CHART_CENTER}
        r={INNER_RADIUS}
        fill={isMaster ? "rgba(15,23,42,0.72)" : "rgba(15,23,42,0.55)"}
        stroke={isMaster ? "rgba(251,191,36,0.28)" : "rgba(251,191,36,0.2)"}
        strokeWidth={1}
      />
      <circle
        cx={CHART_CENTER}
        cy={CHART_CENTER}
        r={4}
        fill="rgba(251,191,36,0.85)"
      />

      {showAscMarker ? (
        <>
          <line
            x1={ascLeft}
            y1={CHART_CENTER}
            x2={CHART_CENTER + OUTER_RADIUS}
            y2={CHART_CENTER}
            stroke="rgba(251,191,36,0.55)"
            strokeWidth={1.25}
            strokeDasharray="5 4"
          />
          <g aria-label="Yükselen burç">
            <polygon
              points={`${ascLeft},${CHART_CENTER} ${ascArrowTip},${CHART_CENTER - 7} ${ascArrowTip},${CHART_CENTER + 7}`}
              fill="rgba(251,191,36,0.95)"
            />
            <text
              x={ascLeft - 6}
              y={CHART_CENTER - 10}
              textAnchor="end"
              className="fill-amber-300 text-[11px] font-bold tracking-[0.2em]"
            >
              ASC
            </text>
          </g>
        </>
      ) : null}

      {Array.from({ length: 12 }).map((_, index) => {
        const longitude = index * 30;
        const chartLongitude = toChartLongitude(longitude, ascendant);
        const radians = ((90 - chartLongitude) * Math.PI) / 180;
        const x = CHART_CENTER + OUTER_RADIUS * Math.cos(radians);
        const y = CHART_CENTER - OUTER_RADIUS * Math.sin(radians);
        return (
          <line
            key={`degree-${index}`}
            x1={CHART_CENTER}
            y1={CHART_CENTER}
            x2={x}
            y2={y}
            stroke={isMaster ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.08)"}
            strokeWidth={isMaster ? 1.15 : 1}
          />
        );
      })}

      {isMaster
        ? Array.from({ length: 72 }).map((_, index) => {
            const longitude = index * 5;
            const chartLongitude = toChartLongitude(longitude, ascendant);
            const radians = ((90 - chartLongitude) * Math.PI) / 180;
            const isMajorTick = longitude % 30 === 0;
            const x1 =
              CHART_CENTER +
              (isMajorTick ? tickInnerMajor : degreeRingRadius - 4) * Math.cos(radians);
            const y1 =
              CHART_CENTER -
              (isMajorTick ? tickInnerMajor : degreeRingRadius - 4) * Math.sin(radians);
            const x2 = CHART_CENTER + tickOuter * Math.cos(radians);
            const y2 = CHART_CENTER - tickOuter * Math.sin(radians);

            return (
              <line
                key={`tick-5-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={
                  isMajorTick
                    ? "rgba(251,191,36,0.35)"
                    : "rgba(255,255,255,0.12)"
                }
                strokeWidth={isMajorTick ? 1.1 : 0.65}
              />
            );
          })
        : null}

      {isMaster
        ? houses.map((house) => {
            const chartLongitude = toChartLongitude(house.longitude, ascendant);
            const radians = ((90 - chartLongitude) * Math.PI) / 180;
            const x1 = CHART_CENTER + (INNER_RADIUS - 4) * Math.cos(radians);
            const y1 = CHART_CENTER - (INNER_RADIUS - 4) * Math.sin(radians);
            const x2 = CHART_CENTER + OUTER_RADIUS * Math.cos(radians);
            const y2 = CHART_CENTER - OUTER_RADIUS * Math.sin(radians);
            const labelRadius = INNER_RADIUS - 16;
            const labelX = CHART_CENTER + labelRadius * Math.cos(radians);
            const labelY = CHART_CENTER - labelRadius * Math.sin(radians);

            return (
              <g key={`house-${house.house}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(96,165,250,0.22)"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-sky-200/45 text-[7px] font-medium"
                >
                  {HOUSE_ROMAN[house.house - 1]}
                </text>
              </g>
            );
          })
        : null}

      {signTicks.map(({ sign, x1, y1, x2, y2, labelX, labelY }) => (
        <g key={sign}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(251,191,36,0.45)"
            strokeWidth={1.25}
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-amber-200/70 text-[8px] font-medium tracking-wide sm:text-[9px]"
          >
            {sign}
          </text>
        </g>
      ))}
    </g>
  );
}