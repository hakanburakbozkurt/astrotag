"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import ManifestoStoryShare from "@/components/home/ManifestoStoryShare";
import DailyCosmicLayerBlock from "@/components/home/daily-cosmic/DailyCosmicLayerBlock";
import { Colors } from "@/lib/manifesto/daily-cosmic-colors";
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
    MANIFESTO_TECHNIQUES.find((t) => t.id === manifesto?.techniqueType)?.label ?? "";
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
            className="absolute inset-0 bg-black/80"
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
            className={`relative z-10 flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden ${Colors.card}`}
          >
            <header className={`relative flex items-start justify-between gap-3 px-5 pb-4 pt-5 ${Colors.header}`}>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-stone-400" aria-hidden />
                  <p className={Colors.kicker}>Günlük Kozmik Manifesto</p>
                </div>
                <h2 id="daily-cosmic-modal-title" className={`mt-2 ${Colors.title}`}>
                  {userName ? `${userName}, evren seninle konuşuyor` : "Evren seninle konuşuyor"}
                </h2>
                {cycleLabel ? <p className={`mt-1 ${Colors.meta}`}>{cycleLabel}</p> : null}
              </div>
              {readOnly && onClose ? (
                <button type="button" onClick={onClose} className={Colors.iconBtn} aria-label="Kapat">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </header>

            <div className="relative flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {presentation ? (
                <>
                  <DailyCosmicLayerBlock label="Gökyüzü Kapısı" text={presentation.cosmicHook} />
                  <DailyCosmicLayerBlock label="Harita Aynası" text={presentation.natalMirror} />
                  <DailyCosmicLayerBlock
                    label="Manifesto"
                    text={presentation.manifestoClaim}
                    variant="highlight"
                    highlight
                  />
                  <DailyCosmicLayerBlock
                    label="Ritüel Fısıltısı"
                    text={presentation.ritualWhisper}
                    variant="muted"
                  />
                  <section className={`p-4 ${Colors.story}`}>
                    <p className={`mb-3 text-center ${Colors.label}`}>Story · 9:16</p>
                    <ManifestoStoryShare
                      presentation={presentation}
                      userName={userName}
                      categoryLabel={categoryLabel}
                      cycleLabel={cycleLabel}
                    />
                  </section>
                </>
              ) : manifesto.lastMessage ? (
                <p className={`italic ${Colors.body}`}>{manifesto.lastMessage}</p>
              ) : null}
            </div>

            {!readOnly ? (
              <footer className="relative border-t border-zinc-800 p-5">
                <button type="button" onClick={onAccept} className={Colors.acceptBtn}>
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
