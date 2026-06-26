"use client";

import { motion } from "framer-motion";
import type { MinorPointPosition } from "@/lib/astrology/types";
import { longitudeToPoint } from "@/lib/astrology/chart-geometry";
import { CHART_VIEWBOX } from "./constants";

interface MinorPointMarkersProps {
  points: MinorPointPosition[];
  ascendant: number;
}

export default function MinorPointMarkers({
  points,
  ascendant,
}: MinorPointMarkersProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {points.map((point, index) => {
        const chartPoint = longitudeToPoint(
          point.longitude,
          CHART_VIEWBOX / 2,
          CHART_VIEWBOX / 2,
          118,
          ascendant
        );
        const leftPct = (chartPoint.x / CHART_VIEWBOX) * 100;
        const topPct = (chartPoint.y / CHART_VIEWBOX) * 100;

        return (
          <motion.div
            key={point.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-300/35 bg-[#0f172a]/90 text-[9px] text-violet-100/90 shadow-[0_0_8px_rgba(167,139,250,0.25)]">
              {point.symbol}
            </span>
            <span className="mt-0.5 max-w-[3rem] truncate text-[6px] uppercase tracking-wide text-violet-200/55">
              {point.name.split(" ")[0]}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
