"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { GlobalFeedbackStats } from "@/lib/actions/feedback";
import { EMPTY_GLOBAL_FEEDBACK_STATS } from "@/lib/feedback/global-feedback-stats.shared";
import { useGlobalFeedbackStats } from "@/hooks/useGlobalFeedbackStats";

export type CosmicAccuracyBadgeProps = {
  /** header: dashboard başlığı; inline: analiz CTA üstü */
  variant?: "header" | "inline";
  className?: string;
  stats?: GlobalFeedbackStats;
};

function formatAccuracyPercent(value: number): number {
  return Math.round(value);
}

function formatAverageRating(value: number): string {
  return value.toFixed(1);
}

function BadgeContent({
  stats,
  variant,
}: {
  stats: GlobalFeedbackStats;
  variant: "header" | "inline";
}) {
  const accuracyLabel = formatAccuracyPercent(stats.accuracy_percentage);
  const ratingLabel = formatAverageRating(stats.average_rating);

  if (variant === "header") {
    return (
      <div className="inline-flex flex-col items-center gap-1 sm:items-start">
        <div className="inline-flex items-center gap-2">
          <span className="text-lg font-bold tabular-nums text-amber-100 sm:text-xl">
            {ratingLabel}
          </span>
          <Star
            className="h-4 w-4 fill-amber-300 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.55)] sm:h-5 sm:w-5"
            aria-hidden
          />
          <span className="text-sm font-medium text-amber-200/75">
            (%{accuracyLabel} İsabet)
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-amber-400/45">
          {stats.total_reviews.toLocaleString("tr-TR")} kozmik değerlendirme
        </p>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-sm">
      <span className="font-semibold tabular-nums text-amber-100">{ratingLabel}</span>
      <Star
        className="h-3.5 w-3.5 fill-amber-300 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
        aria-hidden
      />
      <span className="text-amber-200/70">(%{accuracyLabel} İsabet)</span>
    </div>
  );
}

export default function CosmicAccuracyBadge({
  variant = "inline",
  className = "",
  stats: statsProp,
}: CosmicAccuracyBadgeProps) {
  const { data } = useGlobalFeedbackStats();
  const stats = statsProp ?? data ?? EMPTY_GLOBAL_FEEDBACK_STATS;

  if (stats.total_reviews <= 0) {
    return null;
  }

  const isHeader = variant === "header";

  return (
    <motion.div
      initial={{ opacity: 0, y: isHeader ? -6 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${className}`}
      role="status"
      aria-label={`Ortalama ${formatAverageRating(stats.average_rating)} yıldız, yüzde ${formatAccuracyPercent(stats.accuracy_percentage)} isabet oranı, ${stats.total_reviews} değerlendirme`}
    >
      <div
        className={`relative overflow-hidden rounded-full border border-amber-400/25 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-600/10 ${
          isHeader ? "px-4 py-2.5 sm:px-5" : "px-3 py-1.5"
        }`}
        style={{
          boxShadow:
            "0 0 24px rgba(251,191,36,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(251,191,36,0.18) 0%, transparent 65%)",
          }}
        />
        <div className="relative">
          <BadgeContent stats={stats} variant={variant} />
        </div>
      </div>
    </motion.div>
  );
}
