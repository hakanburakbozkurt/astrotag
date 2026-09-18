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
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-sm text-white/50 transition hover:border-zinc-700 hover:text-stone-300"
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
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-stone-300">
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
              <span className="font-mono text-stone-300">
                {starPoints}/{MAX_STAR_POINTS}
              </span>
            </p>
            {starPointsBonus > 0 ? (
              <p className="text-xs text-stone-300">
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
              className="h-full rounded-full bg-gradient-to-r from-zinc-800 via-zinc-800 to-zinc-900 shadow-[0_0_12px_rgba(255,255,255,0.08)]"
            />
          </div>

          <button
            type="button"
            onClick={() => void claimStars()}
            disabled={isClaiming || !canCharge}
            className="min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-stone-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buttonLabel}
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-xs text-stone-400">{error}</p> : null}
    </motion.section>
  );
}
