"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleHeart, Sparkles, Star } from "lucide-react";
import {
  submitFeedback,
  type SubmitFeedbackResult,
} from "@/lib/actions/feedback";
import { MIN_MILESTONE_RATING } from "@/lib/constants/cosmic";
import { dispatchFeedbackGamificationEvents } from "@/lib/feedback/dispatch-events.client";

export type FeedbackButtonProps = {
  module: string;
  referenceId?: string;
  tier?: string;
  metadata?: Record<string, unknown>;
  /** Kozmik Profil gibi özel akışlar */
  onSubmit?: (rating: number) => Promise<SubmitFeedbackResult | void>;
  onSubmitted?: (result: SubmitFeedbackResult) => void;
  className?: string;
};

const RATING_LABELS: Record<number, string> = {
  1: "Hiç isabet etmedi",
  2: "Zayıf",
  3: "Kısmen",
  4: "İyi",
  5: "Mükemmel",
};

function StarRatingInput({
  value,
  hover,
  disabled,
  onHover,
  onSelect,
}: {
  value: number | null;
  hover: number | null;
  disabled: boolean;
  onHover: (star: number | null) => void;
  onSelect: (star: number) => void;
}) {
  const active = hover ?? value ?? 0;

  return (
    <div
      className="mt-4 flex items-center justify-center gap-1.5 sm:gap-2"
      role="radiogroup"
      aria-label="Analiz puanı 1 ile 5 arası"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} yıldız`}
            disabled={disabled}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(star)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(star)}
            className="rounded-lg p-1 transition disabled:opacity-50"
          >
            <Star
              className={`h-9 w-9 transition sm:h-10 sm:w-10 ${
                filled
                  ? "fill-amber-300 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]"
                  : "fill-transparent text-white/25"
              } ${disabled ? "" : "hover:scale-110"}`}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
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
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRating = useCallback(
    async (rating: number) => {
      if (isSubmitting || isDone) return;

      setIsSubmitting(true);
      setError(null);
      setSelectedRating(rating);

      try {
        const result = onSubmit
          ? (await onSubmit(rating)) ?? { success: true, rating }
          : await submitFeedback({
              module,
              rating,
              referenceId: referenceId ?? stableReferenceId.current,
              tier,
              metadata,
            });

        if (!result.success) {
          setError(result.error ?? "Geri bildirim kaydedilemedi.");
          setSelectedRating(null);
          return;
        }

        setIsDone(true);
        dispatchFeedbackGamificationEvents(result);
        onSubmitted?.(result);

        if (result.milestoneReached && (result.starsEarned ?? 0) > 0) {
          setMessage(
            `Seviye atladın! +${result.starsEarned} yıldız kazandın — rozet profilinde.`
          );
        } else if (result.milestoneReached) {
          setMessage("Seviye atladın! Yeni rozetin profilinde.");
        } else if (rating >= MIN_MILESTONE_RATING) {
          setMessage("Teşekkürler — geri bildirimin kaydedildi.");
        } else {
          setMessage(
            "Geri bildirimin alındı. Milestone ödülleri için genelde 4+ puan gerekir."
          );
        }
      } catch (submitError) {
        console.error("FEEDBACK_BUTTON_ERROR:", submitError);
        setError("Geri bildirim gönderilemedi.");
        setSelectedRating(null);
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

  const previewRating = hoverRating ?? selectedRating;

  return (
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
            Bu analizi 1–5 yıldız ile puanla. 5, 10 ve 20. geri bildirimlerde rozet
            kazanabilirsin.
          </p>
        </div>
      </div>

      {!isDone ? (
        <>
          <StarRatingInput
            value={selectedRating}
            hover={hoverRating}
            disabled={isSubmitting}
            onHover={setHoverRating}
            onSelect={(rating) => void handleSelectRating(rating)}
          />
          <p className="mt-3 text-center text-xs text-white/45">
            {isSubmitting
              ? "Kaydediliyor..."
              : previewRating
                ? RATING_LABELS[previewRating]
                : "Yıldıza dokunarak puan ver"}
          </p>
        </>
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
  );
}
