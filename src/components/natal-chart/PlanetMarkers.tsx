"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PlanetId, PlanetPosition } from "@/lib/astrology/types";
import { longitudeToPoint } from "@/lib/astrology/chart-geometry";
import { PLANET_MEANINGS } from "@/lib/astrology/planet-meanings";
import {
  CHART_VIEWBOX,
  PLANET_ICON_SIZE,
  PLANET_RADIUS,
} from "./constants";
import PlanetIcon from "./PlanetIcon";

interface PlanetMarkersProps {
  planets: PlanetPosition[];
  ascendant: number;
  radiusOffsets: Map<PlanetId, number>;
  activePlanetId: PlanetId | null;
  onPlanetTap: (id: PlanetId) => void;
}

export default function PlanetMarkers({
  planets,
  ascendant,
  radiusOffsets,
  activePlanetId,
  onPlanetTap,
}: PlanetMarkersProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {planets.map((planet, index) => {
        const radius =
          PLANET_RADIUS + (radiusOffsets.get(planet.id) ?? 0);
        const point = longitudeToPoint(
          planet.longitude,
          CHART_VIEWBOX / 2,
          CHART_VIEWBOX / 2,
          radius,
          ascendant
        );
        const leftPct = (point.x / CHART_VIEWBOX) * 100;
        const topPct = (point.y / CHART_VIEWBOX) * 100;
        const isActive = activePlanetId === planet.id;

        return (
          <motion.button
            key={planet.id}
            type="button"
            aria-label={`${planet.name}: ${planet.cardLabel}`}
            onClick={() => onPlanetTap(planet.id)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: index * 0.08,
              type: "spring",
              stiffness: 220,
              damping: 20,
            }}
            whileTap={{ scale: 1.12 }}
            className="pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 touch-manipulation flex-col items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: PLANET_ICON_SIZE + 8,
              height: PLANET_ICON_SIZE + 8,
              filter: "drop-shadow(0 0 10px rgba(255, 215, 0, 0.7))",
            }}
          >
            <AnimatePresence>
              {isActive && (
                <motion.div
                  key="tooltip"
                  role="tooltip"
                  initial={{ opacity: 0, y: 6, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-[min(11rem,42vw)] -translate-x-1/2 rounded-xl border border-amber-400/25 bg-[#0f172a]/95 px-3 py-2 text-left shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md"
                >
                  <p className="text-[11px] font-semibold text-amber-100">
                    {planet.symbol} {planet.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-amber-200/70">
                    {planet.cardLabel}
                  </p>
                  <p className="mt-1.5 text-[10px] leading-snug text-white/65">
                    {PLANET_MEANINGS[planet.id]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <PlanetIcon id={planet.id} size={PLANET_ICON_SIZE} />
            <span className="mt-0.5 text-[7px] font-medium text-amber-100/85 sm:text-[8px]">
              {planet.symbol}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
