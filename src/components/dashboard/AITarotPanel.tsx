"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserData } from "@/types/user";
import {
  TAROT_ACTION_ERROR_MESSAGE,
  TAROT_READING_FALLBACK_MESSAGE,
} from "@/lib/ai/tarot-constants";
import { interpretTarotSpread } from "@/lib/actions/tarot-reading";
import { TAROT_SPREAD_SIZE } from "@/lib/constants/cosmic";
import {
  getTarotCardById,
  type TarotCardDefinition,
} from "@/lib/tarot/deck";
import TarotFlipCard, { FLIP_DURATION } from "@/components/tarot/TarotFlipCard";
import TarotDeck from "@/components/tarot/TarotDeck";
import TarotTypewriterText from "@/components/tarot/TarotTypewriterText";
import TarotShareMenu from "@/components/tarot/TarotShareMenu";
import { TAROT_SPREAD_POSITIONS } from "@/lib/tarot/share-content";
import { tarotDeck } from "@/data/deck";

const TAROT_ERROR_MESSAGES = [
  TAROT_READING_FALLBACK_MESSAGE,
  TAROT_ACTION_ERROR_MESSAGE,
] as const;
const RITUAL_GAP_MS = 1750;

interface AITarotPanelProps {
  user: UserData;
  onClose: () => void;
}

export default function AITarotPanel({ user, onClose }: AITarotPanelProps) {
  const [question, setQuestion] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [ritualFocusIndex, setRitualFocusIndex] = useState(0);
  const [ritualComplete, setRitualComplete] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [fullReading, setFullReading] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [isError, setIsError] = useState(false);
  const [useTypewriter, setUseTypewriter] = useState(false);
  const [validationHint, setValidationHint] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const ritualTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const selectedCards = useMemo(
    () =>
      selectedIds
        .map((id) => getTarotCardById(id))
        .filter((card): card is TarotCardDefinition => Boolean(card)),
    [selectedIds]
  );

  const ritualActive =
    selectedIds.length === TAROT_SPREAD_SIZE && !ritualComplete && !fullReading;

  const showResultPanel = Boolean(fullReading) || isInterpreting;

  const clearRitualTimers = useCallback(() => {
    ritualTimersRef.current.forEach(clearTimeout);
    ritualTimersRef.current = [];
  }, []);

  const scheduleRitualTimer = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay);
    ritualTimersRef.current.push(timer);
  }, []);

  useEffect(() => {
    clearRitualTimers();

    if (selectedIds.length !== TAROT_SPREAD_SIZE || fullReading) {
      if (selectedIds.length !== TAROT_SPREAD_SIZE) {
        setRevealedCount(0);
        setRitualFocusIndex(0);
        setRitualComplete(false);
      }
      return;
    }

    setRevealedCount(0);
    setRitualFocusIndex(0);
    setRitualComplete(false);

    for (let index = 0; index < TAROT_SPREAD_SIZE; index += 1) {
      scheduleRitualTimer(() => {
        setRitualFocusIndex(index);
        setRevealedCount(index + 1);

        if (index < TAROT_SPREAD_SIZE - 1) {
          scheduleRitualTimer(() => {
            setRitualFocusIndex(index + 1);
          }, FLIP_DURATION * 1000);
        } else {
          scheduleRitualTimer(() => {
            setRitualComplete(true);
          }, FLIP_DURATION * 1000);
        }
      }, RITUAL_GAP_MS * (index + 1));
    }

    return clearRitualTimers;
  }, [clearRitualTimers, fullReading, scheduleRitualTimer, selectedIds]);

  const handleSelectCard = (cardId: string) => {
    if (isInterpreting || fullReading || ritualActive) return;

    if (selectedIds.includes(cardId)) {
      setSelectedIds((current) => current.filter((id) => id !== cardId));
      return;
    }

    if (selectedIds.length >= TAROT_SPREAD_SIZE) return;
    setSelectedIds((current) => [...current, cardId]);
    setValidationHint(null);
  };

  const handleInterpret = async () => {
    if (isInterpreting) return;

    setValidationHint(null);
    setShareMessage(null);
    setIsError(false);
    setFullReading(null);
    setUseTypewriter(false);
    setIsCached(false);

    if (!question.trim()) {
      setValidationHint("Yorum için önce sorunuzu yazın.");
      return;
    }

    if (selectedIds.length !== TAROT_SPREAD_SIZE) {
      setValidationHint(`Lütfen desteden ${TAROT_SPREAD_SIZE} kart seçin.`);
      return;
    }

    if (!ritualComplete) {
      setValidationHint("Kartların ritüel ile açılmasını bekleyin.");
      return;
    }

    setIsInterpreting(true);

    try {
      const result = await interpretTarotSpread({
        question: question.trim(),
        userProfile: user,
        cards: selectedCards.map((card, index) => ({
          id: card.id,
          name: card.name,
          position: TAROT_SPREAD_POSITIONS[index],
          keywords: card.keyword
            ? [card.keyword, ...card.meaning.split(", ")]
            : card.meaning.split(", "),
        })),
      });

      const isFallback = TAROT_ERROR_MESSAGES.includes(
        result.reading as (typeof TAROT_ERROR_MESSAGES)[number]
      );
      setIsError(isFallback);
      setIsCached(result.cached);
      setFullReading(result.reading);
      setUseTypewriter(!isFallback);
    } catch {
      setIsError(true);
      setFullReading(TAROT_ACTION_ERROR_MESSAGE);
      setUseTypewriter(false);
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleReset = () => {
    clearRitualTimers();
    setQuestion("");
    setSelectedIds([]);
    setRevealedCount(0);
    setRitualFocusIndex(0);
    setRitualComplete(false);
    setFullReading(null);
    setIsCached(false);
    setIsError(false);
    setUseTypewriter(false);
    setValidationHint(null);
    setShareMessage(null);
  };

  const sharePayload = useMemo(() => {
    if (!fullReading || selectedCards.length !== TAROT_SPREAD_SIZE) {
      return null;
    }

    return {
      question: question.trim(),
      reading: fullReading,
      cards: selectedCards.map((card, index) => ({
        name: card.name,
        position: TAROT_SPREAD_POSITIONS[index],
      })),
    };
  }, [fullReading, question, selectedCards]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-amber-400/20 bg-[#0f172a]/90 backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
              Tarot Ritüeli
            </p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">AI Tarot</h2>
            <p className="mt-1 text-xs text-white/45">Şimdilik ücretsiz</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/50 hover:text-white"
          >
            Kapat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!showResultPanel ? (
            <div className="space-y-4">
              <textarea
                value={question}
                onChange={(event) => {
                  setQuestion(event.target.value);
                  setValidationHint(null);
                }}
                placeholder="Yıldızlara sorunuzu yazın..."
                rows={3}
                disabled={isInterpreting || ritualActive}
                className="min-h-11 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-amber-400/30 disabled:opacity-60"
              />

              {selectedCards.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-amber-400/70">
                    {ritualActive ? "Kartlar Açılıyor..." : "Seçilen Kartlar"}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedCards.map((card, index) => (
                      <TarotFlipCard
                        key={card.id}
                        card={card}
                        flipped={revealedCount > index}
                        selected
                        compact
                        breathing={!ritualComplete && revealedCount <= index}
                        dimmed={ritualActive && ritualFocusIndex !== index}
                        focused={ritualActive && ritualFocusIndex === index}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/45">
                  Desteden kart seç ({selectedIds.length}/{TAROT_SPREAD_SIZE}) ·{" "}
                  {tarotDeck.length} kart
                </p>
                <TarotDeck
                  selectedIds={selectedIds}
                  disabled={isInterpreting || ritualActive}
                  onSelect={(card) => handleSelectCard(card.id)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-b from-amber-950/20 to-[#0f172a]/40 p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
                  Kart Dizilimi
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {selectedCards.map((card) => (
                    <TarotFlipCard
                      key={card.id}
                      card={card}
                      flipped
                      selected
                      compact
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isInterpreting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl border border-amber-400/20 bg-amber-950/15 p-5 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/60">
                      Kozmik Bağlantı
                    </p>
                    <p className="mt-3 text-sm text-amber-100/80">
                      Yıldızlar rehberliğini hazırlıyor...
                    </p>
                    <div className="mx-auto mt-4 h-1 w-24 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-amber-400/70"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{ width: "50%" }}
                      />
                    </div>
                  </motion.div>
                ) : fullReading ? (
                  <motion.div
                    key="reading"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border p-4 ${
                      isError
                        ? "border-red-400/25 bg-gradient-to-b from-red-950/20 to-[#0f172a]/50"
                        : "border-amber-400/25 bg-white/[0.03]"
                    }`}
                  >
                    <p
                      className={`text-[10px] uppercase tracking-[0.25em] ${
                        isError ? "text-red-300/70" : "text-amber-400/60"
                      }`}
                    >
                      {isError ? "Kozmik Sessizlik" : "Parşömen Yorumu"}
                      {isCached && !isError ? " · Önbellek" : ""}
                    </p>

                    {isError ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-red-200/80">
                        {fullReading}
                      </p>
                    ) : (
                      <TarotTypewriterText
                        text={fullReading}
                        active={useTypewriter}
                        className="mt-3 text-sm leading-relaxed text-amber-100/85"
                        onComplete={() => setUseTypewriter(false)}
                      />
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-white/10 px-5 py-4">
          {!fullReading ? (
            <>
              {ritualActive ? (
                <p className="text-center text-xs text-amber-300/60">
                  Kartlar sırayla açılıyor...
                </p>
              ) : null}

              {validationHint ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-amber-400/20 bg-amber-950/20 px-3 py-2 text-center text-xs text-amber-200/75"
                >
                  {validationHint}
                </motion.p>
              ) : null}

              <button
                type="button"
                onClick={() => void handleInterpret()}
                disabled={isInterpreting}
                className="min-h-11 w-full rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-sm font-medium text-amber-100 transition hover:border-amber-400/50 hover:bg-amber-500/25 disabled:cursor-wait disabled:opacity-80"
              >
                {isInterpreting
                  ? "Yıldızlar rehberliğini hazırlıyor..."
                  : ritualActive
                    ? "Ritüel devam ediyor..."
                    : "Yorumla"}
              </button>
            </>
          ) : (
            <>
              {shareMessage ? (
                <p className="text-center text-xs text-amber-200/70">{shareMessage}</p>
              ) : null}
              {!isError && sharePayload ? (
                <TarotShareMenu
                  payload={sharePayload}
                  onMessage={setShareMessage}
                />
              ) : null}
              <button
                type="button"
                onClick={handleReset}
                className="min-h-11 w-full rounded-xl border border-amber-400/25 bg-amber-400/10 text-sm text-amber-100"
              >
                Yeni Açılım
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
