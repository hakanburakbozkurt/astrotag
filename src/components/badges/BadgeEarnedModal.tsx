"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Award, Compass, Eye, Sparkles, Star, X } from "lucide-react";
import type { GrantedBadgePayload } from "@/lib/badges/badge-definitions";
import ConfettiBurst from "@/components/badges/ConfettiBurst";

type BadgeEarnedModalProps = {
  badges: GrantedBadgePayload[];
  onClose: () => void;
};

function BadgeIcon({ icon, className }: { icon: GrantedBadgePayload["icon"]; className?: string }) {
  switch (icon) {
    case "compass":
      return <Compass className={className} aria-hidden />;
    case "sparkles":
      return <Sparkles className={className} aria-hidden />;
    case "eye":
    default:
      return <Eye className={className} aria-hidden />;
  }
}

export default function BadgeEarnedModal({ badges, onClose }: BadgeEarnedModalProps) {
  const badge = badges[0];

  return (
    <AnimatePresence>
      {badge ? (
        <>
          <motion.button
            type="button"
            aria-label="Kapat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="badge-earned-title"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-[110] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-amber-400/25 bg-[#0a0f1a]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <ConfettiBurst />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg border border-white/10 p-1.5 text-white/45 transition hover:text-white"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0.7, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.08 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/35 bg-gradient-to-br from-amber-400/20 to-amber-500/5"
              >
                <BadgeIcon icon={badge.icon} className="h-9 w-9 text-amber-200" />
              </motion.div>

              <p className="mt-5 text-[10px] uppercase tracking-[0.32em] text-amber-400/75">
                Yeni Rozet Kazandın!
              </p>
              <h2 id="badge-earned-title" className="mt-2 text-2xl font-bold text-white">
                {badge.name}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{badge.description}</p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">
                <Star className="h-4 w-4 fill-amber-300/80 text-amber-300/80" aria-hidden />
                +{badge.starReward} hediye yıldız
              </div>

              {badges.length > 1 ? (
                <p className="mt-4 text-xs text-white/40">
                  +{badges.length - 1} rozet daha kazandın — profilden görüntüle
                </p>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 text-sm font-medium text-amber-100 transition hover:bg-amber-400/18"
              >
                <Award className="h-4 w-4" aria-hidden />
                Harika!
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
