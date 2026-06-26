"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Card } from "@/data/deck";
import { tarotDeck } from "@/data/deck";
import CardBackSVG from "@/components/tarot/CardBackSVG";

const CARD_WIDTH = 64;
const CARD_HEIGHT = 112;

const DECK_CARD_GLOW =
  "ring-amber-400/25 shadow-[0_0_12px_rgba(251,191,36,0.18)]";

function useDeckLayoutMetrics(cardCount: number) {
  const [viewportWidth, setViewportWidth] = useState(390);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return useMemo(() => {
    const xAmplitude = Math.min(50, Math.max(30, viewportWidth * 0.1));

    // 78 kart için S formunu koruyarak tıklanabilir aralık
    const overlapFactor = cardCount > 50 ? 0.24 : cardCount > 22 ? 0.28 : 0.32;
    const yStep = Math.max(
      20,
      Math.min(34, Math.round(CARD_HEIGHT * overlapFactor))
    );

    const deckWidth = CARD_WIDTH + xAmplitude * 2 + 24;
    const deckHeight = (cardCount - 1) * yStep + CARD_HEIGHT;

    return { xAmplitude, yStep, deckWidth, deckHeight };
  }, [cardCount, viewportWidth]);
}

function getCardPosition(index: number, yStep: number, xAmplitude: number) {
  const wave = Math.sin(index * 0.5);
  return {
    x: wave * xAmplitude,
    y: index * yStep,
    rotate: wave * 10,
  };
}

interface TarotDeckProps {
  selectedIds?: string[];
  disabled?: boolean;
  onSelect?: (card: Card) => void;
}

export default function TarotDeck({
  selectedIds = [],
  disabled = false,
  onSelect,
}: TarotDeckProps) {
  const reduceMotion = useReducedMotion();

  const { xAmplitude, yStep, deckWidth, deckHeight } = useDeckLayoutMetrics(
    tarotDeck.length
  );

  const positions = useMemo(
    () =>
      tarotDeck.map((card, index) => ({
        card,
        index,
        ...getCardPosition(index, yStep, xAmplitude),
      })),
    [xAmplitude, yStep]
  );

  return (
    <div
      className="relative h-auto min-h-full w-full overflow-y-auto overflow-x-hidden pointer-events-auto pb-[100px] [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15"
      style={{ height: "auto", minHeight: "100%" }}
    >
      <div
        className="relative mx-auto h-auto min-h-full"
        style={{
          width: deckWidth,
          height: "auto",
          minHeight: deckHeight,
        }}
      >
        {tarotDeck.map((card, index) => {
          const position = positions[index];
          if (!position) return null;

          const { x, y, rotate } = position;
          const isSelected = selectedIds.includes(card.id);

          return (
            <motion.button
              key={card.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(card)}
              initial={
                reduceMotion ? false : { opacity: 0, x, y: y + 24, rotate }
              }
              animate={{
                opacity: isSelected ? 0.55 : 1,
                x,
                y,
                rotate,
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.4,
                delay: reduceMotion ? 0 : index * 0.004,
                ease: "easeOut",
              }}
              className={`pointer-events-auto absolute cursor-pointer overflow-hidden rounded-xl border bg-[#0f172a] will-change-transform transform-gpu ${
                isSelected ? "border-amber-400/50" : "border-white/10"
              } ${DECK_CARD_GLOW} ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
              style={{
                left: deckWidth / 2 - CARD_WIDTH / 2,
                top: 0,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                zIndex: index,
                transformOrigin: "center center",
              }}
              aria-label={card.name}
              aria-pressed={isSelected}
              whileHover={
                reduceMotion || disabled
                  ? undefined
                  : {
                      y: y - 8,
                      scale: 1.05,
                      rotate: rotate * 0.6,
                      zIndex: tarotDeck.length + index + 1,
                    }
              }
              whileTap={reduceMotion || disabled ? undefined : { scale: 0.97 }}
            >
              <CardBackSVG className="pointer-events-none h-full w-full object-cover" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
