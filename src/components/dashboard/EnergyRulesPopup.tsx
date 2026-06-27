"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { REFERRAL_STAR_POINTS_BONUS } from "@/lib/constants/cosmic";

export const STAR_POINTS_RULES = [
  "Yeni kayıt: 20 başlangıç yıldızı.",
  "Yıldız Topla: 6 saatte bir +2 (maks. 100).",
  "Harcanan yıldızlar önce bonus bakiyeden, sonra ana bakiyeden düşülür.",
  "Tarot açılımı: −3 yıldız. Diğer analizler: −1.",
  `Referans bonusu: +${REFERRAL_STAR_POINTS_BONUS} (100 limitinin üzerine).`,
  "Aynı 3 tarot kartı 24 saat içinde önbellekten gelir (yıldız harcanmaz).",
] as const;

/** @deprecated Use STAR_POINTS_RULES */
export const ENERGY_RULES = STAR_POINTS_RULES;

type EnergyRulesPopupProps = {
  open: boolean;
  onClose: () => void;
  ignoreRef?: RefObject<HTMLElement | null>;
};

export function EnergyRulesPopup({
  open,
  onClose,
  ignoreRef,
}: EnergyRulesPopupProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (ignoreRef?.current?.contains(target)) {
        return;
      }

      if (panelRef.current?.contains(target)) {
        return;
      }

      onClose();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, ignoreRef]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Kapat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] cursor-default bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="energy-rules-title"
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-[210] flex w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0f1a]/95 shadow-[0_32px_64px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="border-b border-white/[0.08] px-5 py-3.5 sm:px-6"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
                backgroundSize: "100% 3px",
              }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/80">
                SYS · STAR_POINTS_RULES
              </p>
              <h2
                id="energy-rules-title"
                className="mt-1 text-sm font-medium tracking-tight text-white/90"
              >
                Yıldız Kuralları
              </h2>
            </div>

            <div className="max-h-[min(75dvh,24rem)] overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
              <ul className="space-y-0">
                {STAR_POINTS_RULES.map((rule, index) => (
                  <li
                    key={rule}
                    className="mb-4 flex gap-3 border-b border-white/[0.05] pb-4 leading-[1.75] last:mb-0 last:border-0 last:pb-0"
                  >
                    <span
                      className="shrink-0 font-mono text-[10px] tabular-nums text-amber-400/50"
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-white/72">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-white/[0.06] px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg border border-white/10 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 transition hover:border-amber-400/25 hover:text-amber-100"
              >
                Kapat
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
