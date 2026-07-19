"use client";

import { motion } from "framer-motion";
import type { AnalysisUiStatus, OracleAnalysisPresentation } from "@/lib/analysis/types";
import AnalysisDetailsAccordion from "@/components/analysis/AnalysisDetailsAccordion";
import AnalysisExecutiveSummary from "@/components/analysis/AnalysisExecutiveSummary";
import KozmicShareButton, {
  type OracleShareModuleId,
  type ShareableCardModuleContent,
} from "@/components/analysis/KozmicShareButton";

export interface AnalysisShareConfig {
  moduleId: OracleShareModuleId;
  moduleLabel: string;
  content?: ShareableCardModuleContent;
}

interface AnalysisResultsProps {
  status: AnalysisUiStatus;
  presentation: OracleAnalysisPresentation | null;
  error?: string | null;
  detailsUnlocked: boolean;
  isUnlocking: boolean;
  unlockError: string | null;
  totalStarPoints: number;
  onUnlockDetails: () => void;
  moduleLabel?: string;
  loadingLabel?: string;
  question?: string;
  defaultDetailsOpen?: boolean;
  share?: AnalysisShareConfig;
}

function AnalysisLoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        className="h-9 w-9 rounded-full border-2 border-amber-400/15 border-t-amber-400/80"
      />
      <p className="text-sm text-amber-200/70">{label}</p>
    </div>
  );
}

export default function AnalysisResults({
  status,
  presentation,
  error,
  detailsUnlocked,
  isUnlocking,
  unlockError,
  totalStarPoints,
  onUnlockDetails,
  moduleLabel = "Analiz Sonucu",
  loadingLabel = "Kozmik veriler harmanlanıyor...",
  question,
  defaultDetailsOpen = false,
  share,
}: AnalysisResultsProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
        {moduleLabel}
      </p>

      {question ? (
        <p className="mt-2 text-xs text-white/45">Soru: {question}</p>
      ) : null}

      {status === "loading" ? <AnalysisLoadingState label={loadingLabel} /> : null}

      {status === "error" && error ? (
        <p className="mt-4 text-sm text-red-300/80" role="alert">
          {error}
        </p>
      ) : null}

      {status === "ready" && presentation ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 space-y-4"
        >
          <AnalysisExecutiveSummary
            summary={presentation.executiveSummary}
            shareAction={
              share ? (
                <KozmicShareButton
                  executiveSummary={presentation.executiveSummary}
                  moduleId={share.moduleId}
                  moduleLabel={share.moduleLabel}
                  content={{
                    ...share.content,
                    question: share.content?.question ?? question,
                  }}
                />
              ) : null
            }
          />

          <AnalysisDetailsAccordion
            details={presentation.details}
            isPremium={presentation.isPremium}
            cost={presentation.cost}
            detailsUnlocked={detailsUnlocked}
            isUnlocking={isUnlocking}
            unlockError={unlockError}
            onUnlock={onUnlockDetails}
            totalStarPoints={totalStarPoints}
            defaultOpen={defaultDetailsOpen}
          />
        </motion.div>
      ) : null}
    </section>
  );
}
