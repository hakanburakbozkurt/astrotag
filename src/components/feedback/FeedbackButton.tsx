"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleHeart, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import BadgeEarnedModal from "@/components/badges/BadgeEarnedModal";
import {
  submitFeedback,
  type SubmitFeedbackResult,
} from "@/lib/actions/feedback";
import type { GrantedBadgePayload } from "@/lib/badges/badge-definitions";
import {
  FEEDBACK_UPDATED_EVENT,
  STAR_POINTS_UPDATED_EVENT,
} from "@/lib/energy-events";

export type FeedbackButtonProps = {
  module: string;
  referenceId?: string;
  tier?: string;
  metadata?: Record<string, unknown>;
  /** Kozmik Profil gibi özel akışlar için (submitFeedback yerine) */
  onSubmit?: (accurate: boolean) => Promise<SubmitFeedbackResult | void>;
  onSubmitted?: (result: SubmitFeedbackResult) => void;
  className?: string;
};

function dispatchFeedbackEvents(result: SubmitFeedbackResult) {
  if (result.feedbackCount !== undefined) {
    window.dispatchEvent(
      new CustomEvent(FEEDBACK_UPDATED_EVENT, {
        detail: { feedbackCount: result.feedbackCount },
      })
    );
  }

  if (result.totalStarPoints !== undefined) {
    window.dispatchEvent(
      new CustomEvent(STAR_POINTS_UPDATED_EVENT, {
        detail: { starPoints: result.totalStarPoints },
      })
    );
  }
}

export default function FeedbackButton({
  module,
  referenceId,
  tier,
  metadata,
  onSubmit,
  onSubmitted,
  className = "",
}: FeedbackButtonProps) {
  const stableReferenceId = useRef(referenceId ?? crypto.randomUUID());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [accurateChoice, setAccurateChoice] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<GrantedBadgePayload[]>([]);

  const handleChoice = useCallback(
    async (accurate: boolean) => {
      if (isSubmitting || isDone) return;

      setIsSubmitting(true);
      setError(null);
      setAccurateChoice(accurate);

      try {
        const result = onSubmit
          ? (await onSubmit(accurate)) ?? { success: true }
          : await submitFeedback({
              module,
              accurate,
              referenceId: referenceId ?? stableReferenceId.current,
              tier,
              metadata,
            });

        if (!result.success) {
          setError(result.error ?? "Geri bildirim kaydedilemedi.");
          setAccurateChoice(null);
          return;
        }

        setIsDone(true);
        dispatchFeedbackEvents(result);
        onSubmitted?.(result);

        if (result.earnedBadges?.length) {
          setEarnedBadges(result.earnedBadges);
        }

        if (accurate && (result.starsEarned ?? 0) > 0) {
          setMessage(`Teşekkürler! +${result.starsEarned} yıldız kazandın.`);
        } else if (accurate) {
          setMessage("Teşekkürler — geri bildirimin kaydedildi.");
        } else {
          setMessage("Geri bildirimin alındı. Deneyimi iyileştirmek için kullanacağız.");
        }
      } catch (submitError) {
        console.error("FEEDBACK_BUTTON_ERROR:", submitError);
        setError("Geri bildirim gönderilemedi.");
        setAccurateChoice(null);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isDone,
      isSubmitting,
      metadata,
      module,
      onSubmit,
      onSubmitted,
      referenceId,
      tier,
    ]
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-[#0f172a]/60 p-4 sm:p-5 ${className}`}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-200/90">
            <MessageCircleHeart className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] text-amber-400/65">
              Kozmik Geri Bildirim
            </p>
            <p className="mt-1 text-sm text-white/78">
              Bu analiz sana hitap etti mi? Geri bildirimin rozet ilerlemeni ve yıldız
              ödüllerini besler.
            </p>
          </div>
        </div>

        {!isDone ? (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleChoice(true)}
              className="group flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2.5 text-sm font-medium text-emerald-100 transition hover:border-emerald-400/45 hover:bg-emerald-400/15 disabled:opacity-60"
            >
              <ThumbsUp
                className={`h-4 w-4 transition ${isSubmitting && accurateChoice === true ? "animate-pulse" : ""}`}
                aria-hidden
              />
              Evet, isabetli
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleChoice(false)}
              className="group flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2.5 text-sm font-medium text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-400/15 disabled:opacity-60"
            >
              <ThumbsDown
                className={`h-4 w-4 transition ${isSubmitting && accurateChoice === false ? "animate-pulse" : ""}`}
                aria-hidden
              />
              Geliştirilmeli
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="thanks"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-3.5 py-3"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" aria-hidden />
              <p className="text-sm leading-relaxed text-emerald-100/90">{message}</p>
            </motion.div>
          </AnimatePresence>
        )}

        {error ? (
          <p className="mt-3 text-xs text-red-300/85" role="alert">
            {error}
          </p>
        ) : null}
      </motion.div>

      {earnedBadges.length > 0 ? (
        <BadgeEarnedModal badges={earnedBadges} onClose={() => setEarnedBadges([])} />
      ) : null}
    </>
  );
}
