"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import ManifestoStoryShare from "@/components/home/ManifestoStoryShare";
import {
  MANIFESTO_CATEGORIES,
  MANIFESTO_TECHNIQUES,
  type UserManifestoRecord,
} from "@/lib/manifesto/types";

interface DailyCosmicModalProps {
  open: boolean;
  manifesto: UserManifestoRecord | null;
  userName: string;
  onAccept: () => void;
  onClose?: () => void;
  readOnly?: boolean;
}

function LayerBlock({
  label,
  text,
  variant,
}: {
  label: string;
  text: string;
  variant: "violet" | "amber" | "emerald" | "rose";
}) {
  const styles = {
    violet: "from-violet-500/10 to-transparent border-violet-400/20",
    amber: "from-amber-500/10 to-transparent border-amber-400/20",
    emerald: "from-emerald-500/12 to-transparent border-emerald-400/25",
    rose: "from-rose-500/8 to-transparent border-rose-400/15",
  } as const;

  if (!text.trim()) {
    return null;
  }

  return (
    <article
      className={`rounded-2xl border bg-gradient-to-br p-4 ${styles[variant]}`}
    >
      <p className="text-[9px] uppercase tracking-[0.24em] text-white/40">{label}</p>
      <p
        className={`mt-2 leading-relaxed ${
          variant === "emerald"
            ? "text-base font-semibold italic text-emerald-50/95"
            : "text-sm text-white/85"
        }`}
      >
        {text}
      </p>
    </article>
  );
}

export default function DailyCosmicModal({
  open,
  manifesto,
  userName,
  onAccept,
  onClose,
  readOnly = false,
}: DailyCosmicModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const presentation = manifesto?.presentation;
  const categoryLabel =
    MANIFESTO_CATEGORIES.find((c) => c.id === manifesto?.category)?.label ?? "";
  const techniqueLabel =
    MANIFESTO_TECHNIQUES.find((t) => t.id === manifesto?.techniqueType)?.label ??
    "";
  const cycleLabel = manifesto
    ? `Gün ${manifesto.currentDay} / ${manifesto.maxDays} · ${techniqueLabel}`
    : undefined;

  return (
    <AnimatePresence>
      {open && manifesto ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Kapat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#020617]/85 backdrop-blur-md"
            onClick={readOnly ? onClose : undefined}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-cosmic-modal-title"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="relative z-10 flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border border-violet-400/20 bg-[#0b1220]/95 shadow-[0_0_80px_rgba(139,92,246,0.2)] sm:rounded-[32px]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              aria-hidden
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(251,191,36,0.08) 0%, transparent 40%)",
              }}
            />

            <header className="relative flex items-start justify-between gap-3 border-b border-white/8 px-5 pb-4 pt-5">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-300" aria-hidden />
                  <p className="text-[10px] uppercase tracking-[0.32em] text-violet-300/70">
                    Günlük Kozmik Manifesto
                  </p>
                </div>
                <h2
                  id="daily-cosmic-modal-title"
                  className="mt-2 text-lg font-semibold text-white/95"
                >
                  {userName ? `${userName}, evren seninle konuşuyor` : "Evren seninle konuşuyor"}
                </h2>
                {cycleLabel ? (
                  <p className="mt-1 text-[11px] text-white/40">{cycleLabel}</p>
                ) : null}
              </div>
              {readOnly && onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 p-2 text-white/50 hover:text-white/80"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </header>

            <div className="relative flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {presentation ? (
                <>
                  <LayerBlock
                    label="Gökyüzü Kapısı"
                    text={presentation.cosmicHook}
                    variant="violet"
                  />
                  <LayerBlock
                    label="Harita Aynası"
                    text={presentation.natalMirror}
                    variant="amber"
                  />
                  <LayerBlock
                    label="Manifesto"
                    text={presentation.manifestoClaim}
                    variant="emerald"
                  />
                  <LayerBlock
                    label="Ritüel Fısıltısı"
                    text={presentation.ritualWhisper}
                    variant="rose"
                  />

                  <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="mb-3 text-center text-[10px] uppercase tracking-[0.22em] text-white/35">
                      Story Kartı · 9:16
                    </p>
                    <ManifestoStoryShare
                      presentation={presentation}
                      userName={userName}
                      categoryLabel={categoryLabel}
                      cycleLabel={cycleLabel}
                    />
                  </section>
                </>
              ) : manifesto.lastMessage ? (
                <p className="text-sm italic leading-relaxed text-white/75">
                  {manifesto.lastMessage}
                </p>
              ) : null}
            </div>

            {!readOnly ? (
              <footer className="relative border-t border-white/8 p-5">
                <button
                  type="button"
                  onClick={onAccept}
                  className="w-full rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-amber-500/20 px-4 py-3.5 text-sm font-semibold text-amber-50 shadow-[0_0_24px_rgba(251,191,36,0.12)] transition hover:from-amber-500/28 hover:to-violet-500/28"
                >
                  Bugünün Enerjisini Kabul Ediyorum
                </button>
              </footer>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
