"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { TarotCardDefinition } from "@/lib/tarot/deck";
import { getTarotImageCandidates } from "@/lib/tarot/image-paths";
import CardBackSVG from "@/components/tarot/CardBackSVG";

export const FLIP_DURATION = 0.65;

const CARD_ASPECT_CLASS = "aspect-[2/3.5] w-full min-w-[68px] max-w-full";

interface TarotFlipCardProps {
  card: TarotCardDefinition;
  flipped: boolean;
  selected: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  compact?: boolean;
  breathing?: boolean;
  dimmed?: boolean;
  focused?: boolean;
}

function CardGlow({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-px rounded-xl bg-amber-400/12 ring-1 ring-amber-400/25"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    />
  );
}

function CardFace({
  selected,
  children,
}: {
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-xl border bg-[#0f172a] ${
        selected ? "border-amber-400/40" : "border-amber-400/15"
      }`}
    >
      <CardGlow active={selected} />
      {children}
    </div>
  );
}

function CardShell({
  children,
  className,
  breathing,
  dimmed,
  focused,
  reduceMotion,
}: {
  children: ReactNode;
  className: string;
  breathing: boolean;
  dimmed: boolean;
  focused: boolean;
  reduceMotion: boolean;
}) {
  const breatheTransition = useMemo(
    () => ({
      duration: 3.2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    }),
    []
  );

  return (
    <motion.div
      className={className}
      initial={false}
      animate={
        reduceMotion
          ? { opacity: dimmed ? 0.5 : 1, scale: 1, filter: "blur(0px)" }
          : {
              opacity: dimmed ? 0.38 : 1,
              scale: breathing ? [1, 1.03, 1] : focused ? 1.02 : 1,
              filter: dimmed ? "blur(1.5px)" : "blur(0px)",
            }
      }
      transition={
        breathing && !reduceMotion
          ? { opacity: { duration: 0.45 }, filter: { duration: 0.45 }, scale: breatheTransition }
          : { duration: 0.45, ease: "easeOut" }
      }
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

export default function TarotFlipCard({
  card,
  flipped,
  selected,
  disabled = false,
  onSelect,
  compact = false,
  breathing = false,
  dimmed = false,
  focused = false,
}: TarotFlipCardProps) {
  const reduceMotion = useReducedMotion();
  const imageCandidates = useMemo(
    () => getTarotImageCandidates(card.id),
    [card.id]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const showFrontFace = selected && flipped;
  const frontImageSrc = imageCandidates[candidateIndex] ?? "";
  const allCandidatesFailed = candidateIndex >= imageCandidates.length;

  const cardSizeClass = useMemo(
    () => (compact ? `${CARD_ASPECT_CLASS} max-w-[92px] sm:max-w-none` : CARD_ASPECT_CLASS),
    [compact]
  );

  const flipTransition = useMemo(
    () => ({
      duration: reduceMotion ? 0 : FLIP_DURATION,
      ease: "easeInOut" as const,
    }),
    [reduceMotion]
  );

  useEffect(() => {
    setCandidateIndex(0);
  }, [card.id, imageCandidates]);

  if (!selected) {
    return (
      <CardShell
        className="flex w-full flex-col items-center"
        breathing={breathing}
        dimmed={dimmed}
        focused={focused}
        reduceMotion={Boolean(reduceMotion)}
      >
        <motion.button
          type="button"
          disabled={disabled}
          onClick={onSelect}
          whileTap={disabled || reduceMotion ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className={`relative ${cardSizeClass} touch-manipulation will-change-transform transform-gpu disabled:cursor-default`}
          aria-label="Kapalı tarot kartı"
        >
          <CardFace selected={false}>
            <CardBackSVG className="h-full w-full object-cover" />
          </CardFace>
        </motion.button>
      </CardShell>
    );
  }

  return (
    <CardShell
      className="flex w-full flex-col items-center"
      breathing={breathing && !showFrontFace}
      dimmed={dimmed}
      focused={focused}
      reduceMotion={Boolean(reduceMotion)}
    >
      <div
        className={`relative ${cardSizeClass} [perspective:1200px] transform-gpu`}
        style={{ perspective: 1200 }}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={onSelect}
          className="relative block h-full w-full touch-manipulation will-change-transform transform-gpu disabled:cursor-default"
          aria-label={showFrontFace ? card.englishName : "Seçili tarot kartı"}
        >
          <motion.div
            className="relative h-full w-full will-change-transform transform-gpu"
            initial={false}
            animate={{ rotateY: showFrontFace ? 180 : 0 }}
            transition={flipTransition}
            style={{ transformStyle: "preserve-3d" }}
          >
            <CardFace selected>
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "translateZ(2px)",
                }}
              >
                <CardBackSVG className="h-full w-full object-cover" />
              </div>
            </CardFace>

            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg) translateZ(2px)",
              }}
            >
              <CardFace selected>
                {allCandidatesFailed || !frontImageSrc ? (
                  <CardBackSVG className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={frontImageSrc}
                    src={frontImageSrc}
                    alt={card.englishName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={() => {
                      setCandidateIndex((current) => current + 1);
                    }}
                  />
                )}
              </CardFace>
            </div>
          </motion.div>
        </button>
      </div>
    </CardShell>
  );
}
