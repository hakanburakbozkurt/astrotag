"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { AspectType } from "@/lib/astrology/types";
import { longitudeToPoint } from "@/lib/astrology/chart-geometry";
import type {
  SynastryAspectLine,
  SynastryWheelPlanet,
} from "@/lib/synastry/synastry-calculation";

const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 240;
const LEFT_CENTER = { x: 92, y: 118 };
const RIGHT_CENTER = { x: 268, y: 118 };
const WHEEL_RADIUS = 72;
const PLANET_DOT_RADIUS = 72;
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
  insightLines: string[];
  score?: number | null;
  summary?: string | null;
  date?: string | null;
}

function aspectStrokeStyle(type: AspectType): {
  stroke: string;
  strokeWidth: number;
  opacity: number;
} {
  if (type === "square") {
    return {
      stroke: "#ef4444",
      strokeWidth: 2.2,
      opacity: 0.92,
    };
  }

  if (type === "trine") {
    return {
      stroke: "#f59e0b",
      strokeWidth: 2,
      opacity: 1,
    };
  }

  if (type === "opposition") {
    return {
      stroke: "rgba(168,85,247,0.85)",
      strokeWidth: 1.6,
      opacity: 0.85,
    };
  }

  return {
    stroke: "rgba(251,191,36,0.85)",
    strokeWidth: 1.8,
    opacity: 0.88,
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

export default function SynastryVisualizer({
  aspectLines,
  userPlanets,
  partnerPlanets,
  userAscendant,
  partnerAscendant,
  userName,
  partnerName,
  insightLines,
  score,
  summary,
  date,
}: SynastryVisualizerProps) {
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

          const from = longitudeToPoint(
            userPlanet.longitude,
            LEFT_CENTER.x,
            LEFT_CENTER.y,
            PLANET_DOT_RADIUS,
            userAscendant
          );
          const to = longitudeToPoint(
            partnerPlanet.longitude,
            RIGHT_CENTER.x,
            RIGHT_CENTER.y,
            PLANET_DOT_RADIUS,
            partnerAscendant
          );

          return {
            aspect,
            index,
            d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
            from,
            to,
          };
        })
        .filter(Boolean),
    [
      aspectLines,
      userPlanetMap,
      partnerPlanetMap,
      userAscendant,
      partnerAscendant,
    ]
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

      <div className="relative mx-auto w-full max-w-md">
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
                  stdDeviation="2"
                  floodColor="#f59e0b"
                  floodOpacity="0.65"
                />
              </filter>
            </defs>

            {[LEFT_CENTER, RIGHT_CENTER].map((center, index) => (
              <circle
                key={index}
                cx={center.x}
                cy={center.y}
                r={WHEEL_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            ))}

            {userPlanets.map((planet) => {
              const point = longitudeToPoint(
                planet.longitude,
                LEFT_CENTER.x,
                LEFT_CENTER.y,
                PLANET_DOT_RADIUS,
                userAscendant
              );

              return (
                <g key={`user-${planet.id}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={5}
                    fill="#fbbf24"
                    fillOpacity={0.9}
                  />
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

            {partnerPlanets.map((planet) => {
              const point = longitudeToPoint(
                planet.longitude,
                RIGHT_CENTER.x,
                RIGHT_CENTER.y,
                PLANET_DOT_RADIUS,
                partnerAscendant
              );

              return (
                <g key={`partner-${planet.id}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={5}
                    fill="#fde68a"
                    fillOpacity={0.95}
                  />
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
                      ? { filter: "blur(1px)" }
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

          <ul className="space-y-2">
            {insightLines.map((line) => (
              <li
                key={line}
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-[11px] leading-relaxed text-white/65"
              >
                {line}
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
}
