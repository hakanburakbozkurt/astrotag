"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@/hooks/useQuery";
import { useAuth } from "@/lib/auth";
import {
  fetchSynastryScoreCached,
  SWR_KEYS,
} from "@/lib/auth/data-cache";
import type { SynastryScoreResponse } from "@/lib/ai/synastry";
import { SynastryCalculation } from "@/lib/synastry/synastry-calculation";
import type { SynastryCalculationResult } from "@/lib/synastry/synastry-calculation";
import type { UserData } from "@/types/user";
import SocialShareMenu from "@/components/social/SocialShareMenu";
import FormToast from "@/components/ui/FormToast";
import { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";
import { buildSynastryScoreFingerprint } from "@/lib/synastry/synastry-score-engine";
import { buildSynastryBondsSharePayload } from "@/lib/social/adapters/synastry-bonds";
import SynastryVisualizer from "./SynastryVisualizer";

const SCORE_CACHE_PREFIX = "compatibility_score_";

export interface SynastryShareContext {
  question?: string;
  analysisExcerpt?: string;
}

interface SynastryVisualizerSectionProps {
  userData: UserData;
  partnerName: string;
  dateKey: string;
  shareContext?: SynastryShareContext;
}

function scoreCacheKey(dateKey: string, userData: UserData): string {
  return `${dateKey}_${buildSynastryScoreFingerprint(userData)}`;
}

function readCachedScore(
  dateKey: string,
  userData: UserData
): SynastryScoreResponse | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(
    `${SCORE_CACHE_PREFIX}${scoreCacheKey(dateKey, userData)}`
  );
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SynastryScoreResponse;
  } catch {
    return null;
  }
}

function writeCachedScore(dateKey: string, userData: UserData, score: SynastryScoreResponse): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    `${SCORE_CACHE_PREFIX}${scoreCacheKey(dateKey, userData)}`,
    JSON.stringify(score)
  );
}

async function loadSynastryScore(
  userData: UserData,
  dateKey: string
): Promise<SynastryScoreResponse | null> {
  const cached = readCachedScore(dateKey, userData);
  if (cached) {
    return cached;
  }

  const scoreResult = await fetchSynastryScoreCached(userData).catch(() => null);
  if (scoreResult) {
    writeCachedScore(dateKey, userData, scoreResult);
  }
  return scoreResult;
}

export default function SynastryVisualizerSection({
  userData,
  partnerName,
  dateKey,
  shareContext,
}: SynastryVisualizerSectionProps) {
  const { userId } = useAuth();
  const chartCaptureRef = useRef<HTMLDivElement>(null);
  const [synastryData, setSynastryData] = useState<SynastryCalculationResult | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);
  const [calculationLoading, setCalculationLoading] = useState(true);

  const partnerFingerprint = buildSynastryScoreFingerprint(userData);

  const scoreKey =
    userId && userData
      ? SWR_KEYS.synastryScore(userId, dateKey, partnerFingerprint)
      : null;

  const {
    data: score,
    isPending: isScorePending,
  } = useQuery(scoreKey, () => loadSynastryScore(userData, dateKey), {
    fallbackData: readCachedScore(dateKey, userData) ?? undefined,
    revalidateIfStale: true,
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setCalculationLoading(true);
      setToast(null);

      try {
        const calculation = await SynastryCalculation(userData);

        if (cancelled) {
          return;
        }

        if (!calculation.ok) {
          setSynastryData(null);
          setToast(calculation.message);
          return;
        }

        setSynastryData(calculation.data);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setToast(
          err instanceof Error
            ? err.message
            : "Synastry görselleştirmesi yüklenemedi."
        );
      } finally {
        if (!cancelled) {
          setCalculationLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userData, dateKey]);

  const sharePayload = useMemo(() => {
    if (!score || !synastryData) {
      return null;
    }

    return buildSynastryBondsSharePayload({
      userName: userData.name,
      partnerName,
      score: score.score,
      summary: score.summary,
      date: score.date,
      userAscendantDegree: synastryData.userAscendant,
      question: shareContext?.question,
      analysisExcerpt: shareContext?.analysisExcerpt,
    });
  }, [score, synastryData, userData.name, partnerName, shareContext]);

  const isLoading = calculationLoading || (isScorePending && !score);

  if (isLoading) {
    return <SectionSkeleton title="Synastry Visualizer" />;
  }

  if (toast || !synastryData) {
    return (
      <section className="space-y-4 rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6">
        {toast ? (
          <FormToast message={toast} onDismiss={() => setToast(null)} />
        ) : (
          <p className="text-center text-sm text-white/55">
            Synastry görselleştirmesi oluşturulamadı.
          </p>
        )}
      </section>
    );
  }

  return (
    <>
      <SynastryVisualizer
        aspectLines={synastryData.aspectLines}
        userPlanets={synastryData.userPlanets}
        partnerPlanets={synastryData.partnerPlanets}
        userAscendant={synastryData.userAscendant}
        partnerAscendant={synastryData.partnerAscendant}
        userName={synastryData.userName}
        partnerName={synastryData.partnerName}
        score={score?.score}
        summary={score?.summary}
        date={score?.date}
        chartCaptureRef={chartCaptureRef}
      />

      {sharePayload ? (
        <div
          className="mt-3 flex flex-col items-center gap-2"
          data-testid="bonds-synastry-share"
        >
          <SocialShareMenu
            payload={sharePayload}
            chartRef={chartCaptureRef}
            testId="bonds-synastry-share-menu"
          />
          <p
            className="text-[10px] text-white/35"
            data-testid="bonds-synastry-share-score"
          >
            Paylaşım skoru: {sharePayload.score?.value}/100
          </p>
        </div>
      ) : null}
    </>
  );
}
