"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, Lock } from "lucide-react";
import { STAR_PACKAGES_PATH } from "@/lib/constants/cosmic";

interface AnalysisDetailsAccordionProps {
  details: string;
  isPremium: boolean;
  cost: number;
  detailsUnlocked: boolean;
  isUnlocking: boolean;
  unlockError: string | null;
  onUnlock: () => void;
  totalStarPoints: number;
  defaultOpen?: boolean;
}

export default function AnalysisDetailsAccordion({
  details,
  isPremium,
  cost,
  detailsUnlocked,
  isUnlocking,
  unlockError,
  onUnlock,
  totalStarPoints,
  defaultOpen = false,
}: AnalysisDetailsAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  const canViewDetails = !isPremium || detailsUnlocked;

  if (!canViewDetails) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => void onUnlock()}
          disabled={isUnlocking}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/18 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUnlocking ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Lock className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          )}
          Detayları İncele
          {cost > 0 ? ` (−${cost} Yıldız)` : ""}
        </button>

        <p className="text-center text-xs text-white/40">
          Kullanılabilir yıldız: {totalStarPoints}
        </p>

        {unlockError ? (
          <div className="space-y-2 rounded-xl border border-red-400/20 bg-red-950/20 px-4 py-3">
            <p className="text-sm text-red-200/85" role="alert">
              {unlockError}
            </p>
            {totalStarPoints < cost ? (
              <Link
                href={STAR_PACKAGES_PATH}
                className="inline-flex text-xs font-medium text-amber-200/90 underline underline-offset-2"
              >
                Yıldız paketlerine git
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
      >
        <span className="text-sm font-medium text-white/85">Detayları İncele</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-amber-300/70 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/8"
          >
            <div className="px-4 py-4 sm:px-5 sm:py-5">
              <p className="whitespace-pre-wrap text-sm leading-[1.75] text-white/72">
                {details}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
