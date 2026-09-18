"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import {
  CATEGORY_ORBIT,
  CATEGORY_SATELLITE_STYLE,
  orbitPosition,
  SELECTED_SATELLITE,
  TECHNIQUE_ORBIT,
  TECHNIQUE_SATELLITE_STYLE,
  type OrbitStep,
} from "@/components/home/manifesto/manifesto-portal-orbit";
import {
  MANIFESTO_CATEGORIES,
  type ManifestoCategoryId,
  type ManifestoTechniqueId,
} from "@/lib/manifesto/types";

interface ManifestoPortalOrbitProps {
  step: OrbitStep;
  category: ManifestoCategoryId;
  techniqueType: ManifestoTechniqueId;
  disabled?: boolean;
  hideSatellites?: boolean;
  onCategorySelect: (category: ManifestoCategoryId) => void;
  onTechniqueSelect: (technique: ManifestoTechniqueId) => void;
  onTechniqueHover?: (technique: ManifestoTechniqueId | null) => void;
  onBackToCategories: () => void;
  children: ReactNode;
}

const satelliteEnter = {
  initial: { opacity: 0, scale: 0.72 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.72 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

export default function ManifestoPortalOrbit({
  step,
  category,
  techniqueType,
  disabled = false,
  hideSatellites = false,
  onCategorySelect,
  onTechniqueSelect,
  onTechniqueHover,
  onBackToCategories,
  children,
}: ManifestoPortalOrbitProps) {
  const categoryLabel =
    MANIFESTO_CATEGORIES.find((item) => item.id === category)?.label ?? category;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[24rem]">
        {!hideSatellites ? (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-[5] aspect-square w-[94%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-800"
            aria-hidden
          />
        ) : null}

        <AnimatePresence mode="wait">
          {!hideSatellites && step === "category" ? (
            <motion.div
              key="orbit-category"
              className="absolute inset-0"
              initial={{ opacity: 0, rotate: -8 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {CATEGORY_ORBIT.map((satellite, index) => {
                const pos = orbitPosition(satellite.angleDeg, satellite.radiusPct);
                const categoryId = satellite.id as ManifestoCategoryId;
                const style = CATEGORY_SATELLITE_STYLE[categoryId];
                const selected = category === categoryId;

                return (
                  <motion.button
                    key={satellite.id}
                    type="button"
                    disabled={disabled}
                    aria-label={satellite.label}
                    title={satellite.label}
                    onClick={() => onCategorySelect(categoryId)}
                    whileTap={{ scale: 0.94 }}
                    className={`absolute z-20 flex h-[3.25rem] w-[3.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border px-1 text-center transition disabled:opacity-45 sm:h-[3.5rem] sm:w-[3.5rem] ${
                      selected
                        ? `${SELECTED_SATELLITE.border} ${SELECTED_SATELLITE.bg} ${SELECTED_SATELLITE.text}`
                        : `${style.border} ${style.bg} hover:border-zinc-600 hover:bg-zinc-900/80`
                    }`}
                    style={pos}
                    {...satelliteEnter}
                    transition={{ ...satelliteEnter.transition, delay: index * 0.04 }}
                  >
                    <span
                      className={`text-[9px] font-semibold leading-tight tracking-wide sm:text-[10px] ${
                        selected ? "text-stone-300" : "text-stone-400"
                      }`}
                    >
                      {satellite.shortLabel}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : !hideSatellites ? (
            <motion.div
              key="orbit-technique"
              className="absolute inset-0"
              initial={{ opacity: 0, rotate: 8 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {TECHNIQUE_ORBIT.map((satellite, index) => {
                const pos = orbitPosition(satellite.angleDeg, satellite.radiusPct);
                const techniqueId = satellite.id as ManifestoTechniqueId;
                const style = TECHNIQUE_SATELLITE_STYLE[techniqueId];
                const selected = techniqueType === techniqueId;

                return (
                  <motion.button
                    key={satellite.id}
                    type="button"
                    disabled={disabled}
                    aria-label={satellite.label}
                    title={satellite.label}
                    onClick={() => onTechniqueSelect(techniqueId)}
                    onMouseEnter={() => onTechniqueHover?.(techniqueId)}
                    onMouseLeave={() => onTechniqueHover?.(null)}
                    onFocus={() => onTechniqueHover?.(techniqueId)}
                    onBlur={() => onTechniqueHover?.(null)}
                    whileTap={{ scale: 0.94 }}
                    className={`absolute z-20 flex h-[3.35rem] w-[3.35rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border px-1 text-center transition disabled:opacity-45 sm:h-[3.65rem] sm:w-[3.65rem] ${
                      selected
                        ? `${SELECTED_SATELLITE.border} ${SELECTED_SATELLITE.bg} ${SELECTED_SATELLITE.text}`
                        : `${style.border} ${style.bg} hover:border-zinc-600 hover:bg-zinc-900/80`
                    }`}
                    style={pos}
                    {...satelliteEnter}
                    transition={{ ...satelliteEnter.transition, delay: index * 0.05 }}
                  >
                    <span
                      className={`text-[9px] font-semibold leading-tight sm:text-[10px] ${
                        selected ? "text-stone-300" : "text-stone-400"
                      }`}
                    >
                      {satellite.shortLabel}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="absolute left-1/2 top-1/2 z-10 w-[52%] max-w-[12rem] -translate-x-1/2 -translate-y-1/2">
          {children}
        </div>
      </div>

      {!hideSatellites && step === "technique" ? (
        <motion.button
          type="button"
          disabled={disabled}
          onClick={onBackToCategories}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.12 }}
          className="mt-8 flex items-center gap-1.5 rounded-sm border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-stone-400 transition hover:border-zinc-700 hover:text-stone-300 disabled:opacity-45"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          {categoryLabel}
        </motion.button>
      ) : null}
    </div>
  );
}
