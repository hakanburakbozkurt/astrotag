"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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
import AnalysisResults from "@/components/analysis/AnalysisResults";
import { usePaidAnalysis } from "@/hooks/usePaidAnalysis";
import type { AnalysisUiStatus, OracleAnalysisPresentation } from "@/lib/analysis/types";
import { TAROT_SPREAD_POSITIONS } from "@/lib/tarot/share-content";
import { tarotDeck } from "@/data/deck";

const RITUAL_GAP_MS = 1750;

interface TarotPanelProps {
  user: UserData;
  onClose: () => void;
}

export default function TarotPanel({ user, onClose }: TarotPanelProps) {
  const [question, setQuestion] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [ritualFocusIndex, setRitualFocusIndex] = useState(0);
  const [ritualComplete, setRitualComplete] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisUiStatus>("idle");
  const [presentation, setPresentation] = useState<OracleAnalysisPresentation | null>(
    null
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [validationHint, setValidationHint] = useState<string | null>(null);
  const ritualTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const feedbackReferenceId = useRef<string | null>(null);
  const {
    totalStarPoints,
    detailsUnlocked,
    isUnlocking,
    unlockError,
    unlockDetails,
    resetUnlock,
  } = usePaidAnalysis();

  const selectedCards = useMemo(
    () =>
      selectedIds
        .map((id) => getTarotCardById(id))
        .filter((card): card is TarotCardDefinition => Boolean(card)),
    [selectedIds]
  );

  const ritualActive =
    selectedIds.length === TAROT_SPREAD_SIZE && !ritualComplete && !presentation;

  const showResultPanel =
    analysisStatus !== "idle" || Boolean(presentation);
  const isInterpreting = analysisStatus === "loading";

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

    if (selectedIds.length !== TAROT_SPREAD_SIZE || presentation) {
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
  }, [clearRitualTimers, presentation, scheduleRitualTimer, selectedIds]);

  const handleSelectCard = (cardId: string) => {
    if (isInterpreting || presentation || ritualActive) return;

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
    setPresentation(null);
    setAnalysisError(null);
    setIsCached(false);
    resetUnlock();

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

    setAnalysisStatus("loading");

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

      if (!result.presentation) {
        setAnalysisStatus("error");
        setAnalysisError(
          result.errorMessage ??
            TAROT_READING_FALLBACK_MESSAGE ??
            TAROT_ACTION_ERROR_MESSAGE
        );
        return;
      }

      setIsCached(result.cached);
      setPresentation(result.presentation);
      feedbackReferenceId.current = crypto.randomUUID();
      setAnalysisStatus("ready");
    } catch {
      setAnalysisStatus("error");
      setAnalysisError(TAROT_ACTION_ERROR_MESSAGE);
    }
  };

  const handleUnlockDetails = useCallback(() => {
    if (!presentation) {
      return;
    }
    void unlockDetails(presentation.cost);
  }, [presentation, unlockDetails]);

  const handleReset = () => {
    clearRitualTimers();
    resetUnlock();
    setQuestion("");
    setSelectedIds([]);
    setRevealedCount(0);
    setRitualFocusIndex(0);
    setRitualComplete(false);
    setPresentation(null);
    feedbackReferenceId.current = null;
    setAnalysisStatus("idle");
    setAnalysisError(null);
    setIsCached(false);
    setValidationHint(null);
  };

  const tarotShareCards = useMemo(
    () =>
      selectedCards.length === TAROT_SPREAD_SIZE
        ? selectedCards.map((card, index) => ({
            name: card.name,
            position: TAROT_SPREAD_POSITIONS[index],
          }))
        : undefined,
    [selectedCards]
  );

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
              Oracle · Tarot
            </p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Tarot</h2>
            <p className="mt-1 text-xs text-white/45">
              Özet ücretsiz · detaylar −1 Yıldız
              {isCached ? " · Önbellek" : ""}
            </p>
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

              <AnalysisResults
                status={analysisStatus}
                presentation={presentation}
                error={analysisError}
                detailsUnlocked={detailsUnlocked}
                isUnlocking={isUnlocking}
                unlockError={unlockError}
                totalStarPoints={totalStarPoints}
                onUnlockDetails={handleUnlockDetails}
                moduleLabel="Parşömen Yorumu"
                loadingLabel="Yıldızlar rehberliğini hazırlıyor..."
                question={question.trim() || undefined}
                share={{
                  moduleId: "tarot",
                  moduleLabel: "Tarot",
                  content: {
                    question: question.trim() || undefined,
                    cards: tarotShareCards,
                  },
                }}
                feedback={{
                  module: "tarot",
                  referenceId: feedbackReferenceId.current ?? undefined,
                  metadata: { question: question.trim() || undefined },
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-white/10 px-5 py-4">
          {!presentation && analysisStatus !== "ready" ? (
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
            <button
              type="button"
              onClick={handleReset}
              className="min-h-11 w-full rounded-xl border border-amber-400/25 bg-amber-400/10 text-sm text-amber-100"
            >
              Yeni Açılım
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
