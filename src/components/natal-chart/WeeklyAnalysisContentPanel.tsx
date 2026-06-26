"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { WeeklyAnalysisContent } from "@/lib/cosmic-radar/types";
import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";
import {
  compactSectionClass,
  compactLabelClass,
} from "@/components/navigation/compact-ui";
import CosmicRadarShareMenu from "@/components/cosmic-radar/CosmicRadarShareMenu";
import TransitDataAccordion from "./TransitDataAccordion";

interface WeeklyAnalysisContentPanelProps {
  content: WeeklyAnalysisContent;
  selectedSign: ZodiacSign;
}

const OVERVIEW_SECTIONS = [
  { key: "introduction" as const, label: "Giriş" },
  { key: "development" as const, label: "Gelişme" },
  { key: "strategicConclusion" as const, label: "Stratejik Sonuç" },
];

export default function WeeklyAnalysisContentPanel({
  content,
  selectedSign,
}: WeeklyAnalysisContentPanelProps) {
  const strategyCard = content.cards.find((card) => card.id === "strategy");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedSign}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4 pb-1"
      >
        {/* Haftalık Özet */}
        <article className={`${compactSectionClass} min-w-0`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-sm font-semibold text-white">
                Haftalık Özet
              </h3>
              <p className="mt-1 text-xs font-medium text-amber-200/75">
                {content.dateRangeLabel}
              </p>
            </div>
            <CosmicRadarShareMenu
              payload={{
                weekLabel: content.weekLabel,
                cardTitle: "Haftalık Özet",
                cardBody:
                  content.cards.find((card) => card.id === "overview")?.copyText ??
                  "",
                sign: selectedSign,
              }}
            />
          </div>

          <div className="mt-4 space-y-4">
            {OVERVIEW_SECTIONS.map((section) => (
              <div key={section.key}>
                <p className={compactLabelClass}>{section.label}</p>
                <p className="mt-1.5 break-words text-sm leading-relaxed text-white/72">
                  {content.overview[section.key]}
                </p>
              </div>
            ))}
          </div>
        </article>

        {/* Accordion — teknik veriler */}
        <TransitDataAccordion
          rows={content.transitRows}
          perspectiveSign={selectedSign}
        />

        {/* Stratejik Odak */}
        {strategyCard ? (
          <article className={`${compactSectionClass} min-w-0`}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 break-words text-sm font-semibold text-white">
                {strategyCard.title}
              </h3>
              <CosmicRadarShareMenu
                payload={{
                  weekLabel: content.weekLabel,
                  cardTitle: strategyCard.title,
                  cardBody: strategyCard.copyText,
                  sign: selectedSign,
                }}
              />
            </div>
            <p className="mt-3 break-words text-sm leading-relaxed text-white/72">
              {strategyCard.body}
            </p>
          </article>
        ) : null}

        {/* Uyarı alanı */}
        <article
          className={`rounded-[20px] border p-3 sm:p-4 ${
            content.caution.highlight
              ? "border-red-400/30 bg-red-950/25"
              : "border-amber-400/15 bg-amber-950/10"
          } min-w-0`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className={compactLabelClass}>Uyarı alanı</p>
              <h3 className="mt-1 break-words text-sm font-semibold text-white">
                {content.caution.title}
              </h3>
            </div>
            <CosmicRadarShareMenu
              payload={{
                weekLabel: content.weekLabel,
                cardTitle: content.caution.title,
                cardBody: content.caution.body,
                sign: selectedSign,
              }}
            />
          </div>
          <p className="mt-3 break-words whitespace-pre-wrap text-sm leading-relaxed text-white/72">
            {content.caution.body}
          </p>
        </article>
      </motion.div>
    </AnimatePresence>
  );
}
