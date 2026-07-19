"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import DataLoadingState from "@/components/ui/DataLoadingState";
import { EnergyRulesPopup } from "@/components/dashboard/EnergyRulesPopup";
import { MAX_STAR_POINTS } from "@/lib/constants/cosmic";
import { useStarEconomy } from "@/hooks/useStarEconomy";

function EnergyInfoButton() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Yıldız kuralları"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-sm text-white/50 transition hover:border-amber-400/30 hover:text-amber-200/80"
      >
        ?
      </button>
      <EnergyRulesPopup
        open={open}
        onClose={() => setOpen(false)}
        ignoreRef={triggerRef}
      />
    </>
  );
}

export default function SessionCounter() {
  const {
    starPoints,
    starPointsBonus,
    totalStarPoints,
    canCharge,
    fillPercent,
    isLoading,
    isClaiming,
    error,
    claimStars,
    buttonLabel,
  } = useStarEconomy();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:mb-8 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-amber-400/70">
          Kullanılabilir Yıldız
        </p>
        <EnergyInfoButton />
      </div>

      {isLoading ? (
        <DataLoadingState compact className="mt-3 justify-start" />
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-sm font-medium text-white/80">
              Yıldız:{" "}
              <span className="font-mono text-amber-100">
                {starPoints}/{MAX_STAR_POINTS}
              </span>
            </p>
            {starPointsBonus > 0 ? (
              <p className="text-xs text-emerald-300/80">
                Bonus +{starPointsBonus} · Toplam {totalStarPoints}
              </p>
            ) : null}
          </div>

          <div
            className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]"
            role="progressbar"
            aria-valuenow={starPoints}
            aria-valuemin={0}
            aria-valuemax={MAX_STAR_POINTS}
            aria-label={`Kullanılabilir yıldız ${starPoints} / ${MAX_STAR_POINTS}`}
          >
            <motion.div
              initial={false}
              animate={{ width: `${fillPercent}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-amber-500/70 via-amber-400 to-amber-200/90 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
            />
          </div>

          <button
            type="button"
            onClick={() => void claimStars()}
            disabled={isClaiming || !canCharge}
            className="min-h-11 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buttonLabel}
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-xs text-red-300/80">{error}</p> : null}
    </motion.section>
  );
}
