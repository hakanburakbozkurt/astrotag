"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { UserData } from "@/types/user";
import {
  TAROT_ACTION_ERROR_MESSAGE,
  TAROT_READING_FALLBACK_MESSAGE,
} from "@/lib/ai/tarot-constants";
import { interpretTarotSpread, unlockTarotAnalysisDetails } from "@/lib/actions/tarot-reading";
import { TAROT_SPREAD_SIZE } from "@/lib/constants/cosmic";
import { STAR_POINTS_UPDATED_EVENT } from "@/lib/energy-events";
import { useStarEconomy } from "@/hooks/useStarEconomy";
import {
  getTarotCardById,
  type TarotCardDefinition,
} from "@/lib/tarot/deck";
import TarotFlipCard, { FLIP_DURATION } from "@/components/tarot/TarotFlipCard";
import TarotDeck from "@/components/tarot/TarotDeck";
import AnalysisResults from "@/components/analysis/AnalysisResults";
import CosmicAccuracyBadge from "@/components/social-proof/CosmicAccuracyBadge";
import type { AnalysisUiStatus, OracleAnalysisPresentation } from "@/lib/analysis/types";
import { TAROT_SPREAD_POSITIONS } from "@/lib/tarot/share-content";
import { tarotDeck } from "@/data/deck";
import TarotQuickDrawBar from "@/components/tarot/TarotQuickDrawBar";
import { pickRandomSpreadIds } from "@/lib/tarot/random-spread";
import {
  TAROT_QUICK_RITUAL_GAP_MS,
  TAROT_RITUAL_GAP_MS,
} from "@/lib/tarot/tarot-panel-ui";
import { noirSecondaryButtonClass } from "@/lib/theme/noir-tokens";

interface TarotPanelProps {
  user: UserData;
  onClose: () => void;
  layout?: "modal" | "inline";
}

export default function TarotPanel({ onClose, layout = "modal" }: TarotPanelProps) {
  const isInline = layout === "inline";
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
  const { totalStarPoints, refresh: refreshStarPoints } = useStarEconomy();
  const [detailsUnlocked, setDetailsUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<"manual" | "quick">("manual");
  const [manualDeckOpen, setManualDeckOpen] = useState(false);
  const [autoInterpretPending, setAutoInterpretPending] = useState(false);

  const resetUnlock = useCallback(() => {
    setDetailsUnlocked(false);
    setUnlockError(null);
  }, []);

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

    const ritualGap = drawMode === "quick" ? TAROT_QUICK_RITUAL_GAP_MS : TAROT_RITUAL_GAP_MS;

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
      }, ritualGap * (index + 1));
    }

    return clearRitualTimers;
  }, [clearRitualTimers, drawMode, presentation, scheduleRitualTimer, selectedIds]);

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

  const handleInterpret = useCallback(async () => {
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
      const cards = selectedIds
        .map((id) => getTarotCardById(id))
        .filter((card): card is TarotCardDefinition => Boolean(card));

      const result = await interpretTarotSpread({
        question: question.trim(),
        cards: cards.map((card, index) => ({
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
  }, [isInterpreting, question, resetUnlock, ritualComplete, selectedIds]);

  useEffect(() => {
    if (!autoInterpretPending || !ritualComplete || isInterpreting || presentation) {
      return;
    }
    setAutoInterpretPending(false);
    void handleInterpret();
  }, [
    autoInterpretPending,
    handleInterpret,
    isInterpreting,
    presentation,
    ritualComplete,
  ]);

  const handleInstantDraw = useCallback(() => {
    if (isInterpreting || presentation || ritualActive) {
      return;
    }

    if (!question.trim()) {
      setValidationHint("Anlık çekim için önce sorunuzu yazın.");
      return;
    }

    clearRitualTimers();
    resetUnlock();
    setPresentation(null);
    setAnalysisStatus("idle");
    setAnalysisError(null);
    setValidationHint(null);
    setDrawMode("quick");
    setManualDeckOpen(false);
    setSelectedIds(pickRandomSpreadIds(tarotDeck, TAROT_SPREAD_SIZE));
    setAutoInterpretPending(true);
  }, [clearRitualTimers, isInterpreting, presentation, question, resetUnlock, ritualActive]);

  const handleUnlockDetails = useCallback(() => {
    if (!presentation || detailsUnlocked || isUnlocking) {
      return;
    }

    void (async () => {
      setIsUnlocking(true);
      setUnlockError(null);

      try {
        const result = await unlockTarotAnalysisDetails({ cardIds: selectedIds });

        if (!result.ok) {
          setUnlockError(result.error);
          return;
        }

        setPresentation((current) =>
          current ? { ...current, details: result.details } : current
        );
        setDetailsUnlocked(true);
        window.dispatchEvent(
          new CustomEvent(STAR_POINTS_UPDATED_EVENT, {
            detail: { starPoints: result.remainingStars },
          })
        );
        void refreshStarPoints();
      } finally {
        setIsUnlocking(false);
      }
    })();
  }, [
    detailsUnlocked,
    isUnlocking,
    presentation,
    refreshStarPoints,
    selectedIds,
  ]);

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
    setDrawMode("manual");
    setManualDeckOpen(false);
    setAutoInterpretPending(false);
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

  const header = isInline ? (
    <header>
      <p className="text-xs tracking-wide text-stone-500">Oracle · Tarot</p>
      <h2 className="mt-1 font-[family-name:var(--font-serif-display)] text-xl font-normal text-white sm:text-2xl">
        Tarot Açılımı
      </h2>
      <p className="mt-2 text-sm text-stone-400">
        Sorunuzu yazın, kartlarınızı çekin ve yorumu alın.
        {isCached ? " · Önbellek" : ""}
      </p>
    </header>
  ) : (
    <div className="flex items-start justify-between border-b border-zinc-800 px-5 py-4">
      <div>
        <p className="text-xs tracking-wide text-stone-500">Oracle · Tarot</p>
        <h2 className="mt-1 font-[family-name:var(--font-serif-display)] text-xl font-normal text-white sm:text-2xl">
          Tarot Açılımı
        </h2>
        <p className="mt-2 text-sm text-stone-400">
          Özet ücretsiz · detaylar −1 Yıldız
          {isCached ? " · Önbellek" : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={`${noirSecondaryButtonClass} w-auto shrink-0 bg-zinc-950 px-4 hover:bg-zinc-800 hover:text-stone-50`}
      >
        ← Geri
      </button>
    </div>
  );

  const panelBody = (
    <motion.section
      initial={{ opacity: 0, y: isInline ? 12 : 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isInline ? 12 : 40 }}
      onClick={isInline ? undefined : (event) => event.stopPropagation()}
      className={
        isInline
          ? "relative mb-8 w-full min-w-0 space-y-6"
          : "flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-sm border border-zinc-800 bg-zinc-950"
      }
    >
      {header}

      <div className={isInline ? "space-y-4" : "flex-1 overflow-y-auto px-5 py-4"}>
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
                className="min-h-11 w-full resize-none rounded-sm border border-zinc-800 bg-zinc-900 p-4 text-sm text-stone-300 outline-none placeholder:text-stone-600 focus:border-zinc-600 disabled:opacity-60"
              />

              <TarotQuickDrawBar
                onQuickDraw={handleInstantDraw}
                onToggleManual={() => setManualDeckOpen((open) => !open)}
                manualOpen={manualDeckOpen}
                disabled={isInterpreting || ritualActive}
                busy={isInterpreting || ritualActive || autoInterpretPending}
              />

              {selectedCards.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-stone-300">
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

              {manualDeckOpen ? (
                <div>
                  <p className="mb-2 text-xs text-stone-500">
                    Desteden kart seç ({selectedIds.length}/{TAROT_SPREAD_SIZE}) ·{" "}
                    {tarotDeck.length} kart
                  </p>
                  <TarotDeck
                    selectedIds={selectedIds}
                    disabled={isInterpreting || ritualActive}
                    onSelect={(card) => {
                      setDrawMode("manual");
                      handleSelectCard(card.id);
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-sm border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-stone-300">
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

      <div
        className={
          isInline
            ? "space-y-2"
            : "space-y-2 border-t border-zinc-800 px-5 py-4"
        }
      >
        {!presentation && analysisStatus !== "ready" ? (
          <>
            {ritualActive ? (
              <p className="text-center text-xs text-stone-300">
                Kartlar sırayla açılıyor...
              </p>
            ) : null}

            {validationHint ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-xs text-stone-300"
              >
                {validationHint}
              </motion.p>
            ) : null}

            <div className="flex justify-center">
              <CosmicAccuracyBadge variant="inline" />
            </div>

            <button
              type="button"
              onClick={() => void handleInterpret()}
              disabled={isInterpreting}
              className="min-h-11 w-full rounded-sm border border-zinc-700 bg-zinc-900 text-sm font-medium text-stone-300 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-80"
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
            className="min-h-11 w-full rounded-sm border border-zinc-800 bg-zinc-900 text-sm text-stone-300 hover:border-zinc-600"
          >
            Yeni Açılım
          </button>
        )}
      </div>
    </motion.section>
  );

  if (isInline) {
    return panelBody;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center sm:p-4"
      onClick={onClose}
    >
      {panelBody}
    </motion.div>
  );
}
