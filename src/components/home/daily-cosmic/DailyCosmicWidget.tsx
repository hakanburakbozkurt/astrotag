"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import ManifestoStoryShare from "@/components/home/ManifestoStoryShare";
import DailyCosmicLayerBlock from "@/components/home/daily-cosmic/DailyCosmicLayerBlock";
import { Colors } from "@/lib/manifesto/daily-cosmic-colors";
import type { CosmicAssistantNudge } from "@/lib/dashboard/cosmic-assistant";
import {
  MANIFESTO_CATEGORIES,
  MANIFESTO_TECHNIQUES,
  type UserManifestoRecord,
} from "@/lib/manifesto/types";

interface DailyCosmicWidgetProps {
  manifesto: UserManifestoRecord | null;
  userName: string;
  nudge: CosmicAssistantNudge;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function DailyCosmicWidget({
  manifesto,
  userName,
  nudge,
  expanded,
  onExpandedChange,
  onAccept,
  onDismiss,
}: DailyCosmicWidgetProps) {
  const presentation = manifesto?.presentation ?? null;
  const categoryLabel =
    MANIFESTO_CATEGORIES.find((c) => c.id === manifesto?.category)?.label ?? "";
  const techniqueLabel =
    MANIFESTO_TECHNIQUES.find((t) => t.id === manifesto?.techniqueType)?.label ?? "";
  const cycleLabel =
    manifesto && manifesto.maxDays > 0
      ? `Gün ${manifesto.currentDay} / ${manifesto.maxDays} · ${techniqueLabel}`
      : null;

  const showManifestoLayers = Boolean(presentation);
  const showManifestoAccept =
    showManifestoLayers &&
    (nudge.kind === "manifesto_pending" || nudge.kind === "manifesto_streak");

  return (
    <section
      className={`${Colors.card} mb-6 overflow-hidden sm:mb-8`}
      aria-label="Kozmik Asistan · Günlük Rehber"
    >
      <header className={`relative flex items-start justify-between gap-3 px-4 py-4 ${Colors.header}`}>
        <div className="min-w-0 flex-1">
          <p className={Colors.kicker}>Kozmik Asistan · Günlük Rehber</p>
          <h2 className={`mt-2 ${Colors.title}`}>{nudge.title}</h2>
          <p className={`mt-1.5 text-sm leading-relaxed text-stone-400`}>{nudge.message}</p>
          {cycleLabel &&
          (nudge.kind === "manifesto_pending" || nudge.kind === "manifesto_streak") ? (
            <p className={`mt-1 ${Colors.meta}`}>{cycleLabel}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            className={Colors.iconBtn}
            aria-expanded={expanded}
            aria-label={expanded ? "Daralt" : "Genişlet"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onDismiss} className={Colors.iconBtn} aria-label="Kapat">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="daily-cosmic-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 py-4">
              {showManifestoLayers && presentation ? (
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
                  {cycleLabel ? (
                    <section className={`p-4 ${Colors.story}`}>
                      <p className={`mb-3 text-center ${Colors.label}`}>Story · 9:16</p>
                      <ManifestoStoryShare
                        presentation={presentation}
                        userName={userName}
                        categoryLabel={categoryLabel}
                        cycleLabel={cycleLabel}
                      />
                    </section>
                  ) : null}
                </>
              ) : manifesto?.lastMessage ? (
                <p className={`italic ${Colors.body}`}>{manifesto.lastMessage}</p>
              ) : (
                <div className={`p-4 ${Colors.layer}`}>
                  <p className={Colors.body}>{nudge.message}</p>
                  {nudge.ctaHref && nudge.ctaLabel ? (
                    <Link
                      href={nudge.ctaHref}
                      className={`mt-3 inline-flex ${Colors.acceptBtn} w-auto px-4 py-2 text-xs`}
                    >
                      {nudge.ctaLabel}
                    </Link>
                  ) : null}
                </div>
              )}
            </div>

            <footer className="border-t border-zinc-800 px-4 py-4">
              {showManifestoAccept ? (
                <button type="button" onClick={onAccept} className={Colors.acceptBtn}>
                  Bugünün Enerjisini Kabul Ediyorum
                </button>
              ) : nudge.ctaHref && nudge.ctaLabel ? (
                <Link href={nudge.ctaHref} className={`inline-flex ${Colors.acceptBtn}`}>
                  {nudge.ctaLabel}
                </Link>
              ) : null}
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="daily-cosmic-collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3"
          >
            <button
              type="button"
              onClick={() => onExpandedChange(true)}
              className={`${Colors.toggleBtn} text-left`}
            >
              {nudge.collapsedHint}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
