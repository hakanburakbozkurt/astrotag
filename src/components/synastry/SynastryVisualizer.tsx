"use client";

import { forwardRef, useEffect, useMemo, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import type { AspectType } from "@/lib/astrology/types";
import type {
  SynastryAspectLine,
  SynastryWheelPlanet,
} from "@/lib/synastry/synastry-calculation";
import {
  SYNASTRY_LEFT_WHEEL,
  SYNASTRY_RIGHT_WHEEL,
  synastryLocalPlanetPoint,
  synastryPlanetPoint,
  synastryWheelGroupTransform,
} from "@/lib/synastry/synastry-chart-geometry";

const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 240;
const ASPECT_DRAW_DELAY = 0.85;
const INSIGHT_REVEAL_MS = 2500;

const wheelSpring = {
  type: "spring" as const,
  stiffness: 40,
  damping: 12,
};

interface SynastryVisualizerProps {
  aspectLines: SynastryAspectLine[];
  userPlanets: SynastryWheelPlanet[];
  partnerPlanets: SynastryWheelPlanet[];
  userAscendant: number;
  partnerAscendant: number;
  userName: string;
  partnerName: string;
  score?: number | null;
  summary?: string | null;
  date?: string | null;
  chartCaptureRef?: RefObject<HTMLDivElement | null>;
}

function aspectStrokeStyle(type: AspectType): {
  stroke: string;
  strokeWidth: number;
  opacity: number;
  strokeDasharray?: string;
} {
  if (type === "square") {
    return {
      stroke: "#991b1b",
      strokeWidth: 2.6,
      opacity: 0.96,
      strokeDasharray: "6 3",
    };
  }

  if (type === "trine") {
    return {
      stroke: "#c4a035",
      strokeWidth: 2.4,
      opacity: 1,
    };
  }

  if (type === "opposition") {
    return {
      stroke: "rgba(168,85,247,0.88)",
      strokeWidth: 1.8,
      opacity: 0.88,
    };
  }

  return {
    stroke: "rgba(251,191,36,0.9)",
    strokeWidth: 2,
    opacity: 0.9,
  };
}

function SynastryWheel({
  label,
  delay = 0,
}: {
  label: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ y: -600, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...wheelSpring, delay }}
      className="relative flex w-[46%] max-w-[150px] flex-col items-center"
    >
      <div className="relative aspect-square w-full">
        <div className="absolute inset-0 rounded-full border border-amber-400/20 bg-[#0f172a]/55 shadow-[inset_0_0_40px_rgba(251,191,36,0.06)] backdrop-blur-md" />
        <div className="absolute inset-[10%] rounded-full border border-white/10 bg-white/[0.03]" />
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(251,191,36,0.12) 0%, transparent 62%)",
          }}
        />
      </div>
      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.22em] text-amber-200/75">
        {label}
      </p>
    </motion.div>
  );
}

function renderWheelPlanets(
  planets: SynastryWheelPlanet[],
  layout: typeof SYNASTRY_LEFT_WHEEL,
  keyPrefix: "user" | "partner",
  fill: string
) {
  return (
    <g transform={synastryWheelGroupTransform(layout)}>
      <circle
        cx={0}
        cy={0}
        r={layout.radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
      {planets.map((planet) => {
        const point = synastryLocalPlanetPoint(planet.longitude, layout);

        return (
          <g key={`${keyPrefix}-${planet.id}`}>
            <circle cx={point.x} cy={point.y} r={5} fill={fill} fillOpacity={0.92} />
            <text
              x={point.x}
              y={point.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="#0f172a"
            >
              {planet.symbol}
            </text>
          </g>
        );
      })}
    </g>
  );
}

const SynastryVisualizer = forwardRef<HTMLDivElement, SynastryVisualizerProps>(
  function SynastryVisualizer(
    {
      aspectLines,
      userPlanets,
      partnerPlanets,
      userName,
      partnerName,
      score,
      summary,
      date,
      chartCaptureRef,
    },
    ref
  ) {
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowInsights(true), INSIGHT_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const userPlanetMap = useMemo(
    () => new Map(userPlanets.map((planet) => [planet.id, planet])),
    [userPlanets]
  );
  const partnerPlanetMap = useMemo(
    () => new Map(partnerPlanets.map((planet) => [planet.id, planet])),
    [partnerPlanets]
  );

  const renderedAspects = useMemo(
    () =>
      aspectLines
        .map((aspect, index) => {
          const userPlanet = userPlanetMap.get(aspect.userPlanetId);
          const partnerPlanet = partnerPlanetMap.get(aspect.partnerPlanetId);

          if (!userPlanet || !partnerPlanet) {
            return null;
          }

          const from = synastryPlanetPoint(userPlanet.longitude, SYNASTRY_LEFT_WHEEL);
          const to = synastryPlanetPoint(partnerPlanet.longitude, SYNASTRY_RIGHT_WHEEL);

          return {
            aspect,
            index,
            d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
            from,
            to,
          };
        })
        .filter(Boolean),
    [aspectLines, userPlanetMap, partnerPlanetMap]
  );

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-4 backdrop-blur-2xl sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
          Premium Synastry
        </p>
        {typeof score === "number" ? (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.2)]">
            {score}/100
          </span>
        ) : null}
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.16em]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#991b1b]/40 bg-[#991b1b]/15 px-2 py-0.5 text-red-200/90">
          <span className="h-1.5 w-4 rounded-full bg-[#991b1b]" />
          Gerilim (Kare)
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ca8a04]/35 bg-[#ca8a04]/10 px-2 py-0.5 text-amber-100/90">
          <span className="h-1.5 w-4 rounded-full bg-gradient-to-r from-[#ca8a04] to-[#84cc16]" />
          Üçgen Uyumu
        </span>
      </div>

      <div
        ref={chartCaptureRef ?? ref}
        data-testid="synastry-chart-capture"
        className="relative mx-auto w-full max-w-md rounded-2xl border border-white/8 bg-[#0a0f1a] p-3"
      >
        <div className="relative flex items-center justify-between gap-2 px-1">
          <SynastryWheel label={userName} />
          <SynastryWheel label={partnerName} delay={0.08} />

          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <filter id="synastry-glow-gold">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="2.5"
                  floodColor="#84cc16"
                  floodOpacity="0.55"
                />
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="1.5"
                  floodColor="#ca8a04"
                  floodOpacity="0.75"
                />
              </filter>
              <filter id="synastry-glow-tension">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="2"
                  floodColor="#7f1d1d"
                  floodOpacity="0.8"
                />
              </filter>
            </defs>

            {renderWheelPlanets(
              userPlanets,
              SYNASTRY_LEFT_WHEEL,
              "user",
              "#fbbf24"
            )}
            {renderWheelPlanets(
              partnerPlanets,
              SYNASTRY_RIGHT_WHEEL,
              "partner",
              "#fde68a"
            )}

            {renderedAspects.map((item) => {
              if (!item) return null;

              const style = aspectStrokeStyle(item.aspect.type);

              return (
                <motion.path
                  key={item.aspect.id}
                  d={item.d}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={style.strokeDasharray}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: style.opacity }}
                  transition={{
                    pathLength: {
                      duration: 0.75,
                      delay: ASPECT_DRAW_DELAY + item.index * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    },
                    opacity: {
                      duration: 0.35,
                      delay: ASPECT_DRAW_DELAY + item.index * 0.08,
                    },
                  }}
                  style={
                    item.aspect.type === "square"
                      ? { filter: "url(#synastry-glow-tension)" }
                      : undefined
                  }
                  filter={
                    item.aspect.type === "trine"
                      ? "url(#synastry-glow-gold)"
                      : undefined
                  }
                />
              );
            })}
          </svg>
        </div>
      </div>

      {showInsights ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 space-y-3 border-t border-white/10 pt-5"
        >
          {summary ? (
            <p className="text-sm leading-relaxed text-white/75">{summary}</p>
          ) : null}

          <ul className="space-y-3">
            {aspectLines.slice(0, 8).map((aspect) => (
              <li
                key={aspect.id}
                className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4"
              >
                <h4 className="text-base font-semibold leading-snug tracking-tight text-amber-50">
                  {aspect.aspectTitle}
                </h4>

                <p className="mt-2 text-sm leading-relaxed text-white/72">
                  {aspect.planetEffect}
                </p>

                <p className="mt-2.5 text-[11px] leading-relaxed text-white/50">
                  {aspect.aspectDetail}
                </p>

                <p className="mt-3 border-t border-white/[0.06] pt-3 font-mono text-[10px] leading-relaxed tracking-wide text-white/45">
                  {aspect.orbTechnical}
                </p>
              </li>
            ))}
          </ul>

          {date ? (
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              {date}
            </p>
          ) : null}
        </motion.div>
      ) : null}
    </section>
  );
});

export default SynastryVisualizer;
