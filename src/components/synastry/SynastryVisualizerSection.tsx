"use client";

import { useEffect, useState } from "react";
import { fetchSynastryScore } from "@/lib/ai/synastry-client";
import type { SynastryScoreResponse } from "@/lib/ai/synastry";
import {
  SynastryCalculation,
  type SynastryCalculationResult,
} from "@/lib/synastry/synastry-calculation";
import type { UserData } from "@/types/user";
import SynastryShareButton from "@/components/compatibility/SynastryShareButton";
import { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";
import SynastryVisualizer from "./SynastryVisualizer";

const SCORE_CACHE_PREFIX = "compatibility_score_";

interface SynastryVisualizerSectionProps {
  userData: UserData;
  partnerName: string;
  dateKey: string;
}

function readCachedScore(dateKey: string): SynastryScoreResponse | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`${SCORE_CACHE_PREFIX}${dateKey}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SynastryScoreResponse;
  } catch {
    return null;
  }
}

function writeCachedScore(score: SynastryScoreResponse): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    `${SCORE_CACHE_PREFIX}${score.date}`,
    JSON.stringify(score)
  );
}

export default function SynastryVisualizerSection({
  userData,
  partnerName,
  dateKey,
}: SynastryVisualizerSectionProps) {
  const [synastryData, setSynastryData] = useState<SynastryCalculationResult | null>(
    null
  );
  const [score, setScore] = useState<SynastryScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const cachedScore = readCachedScore(dateKey);
        const [calculation, scoreResult] = await Promise.all([
          SynastryCalculation(userData),
          cachedScore
            ? Promise.resolve(cachedScore)
            : fetchSynastryScore(userData).catch(() => null),
        ]);

        if (cancelled) {
          return;
        }

        if (!calculation) {
          setError("Synastry hesaplanamadı.");
          setSynastryData(null);
          return;
        }

        setSynastryData(calculation);

        if (scoreResult) {
          setScore(scoreResult);
          if (!cachedScore) {
            writeCachedScore(scoreResult);
          }
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Synastry görselleştirmesi yüklenemedi."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userData, dateKey]);

  if (isLoading) {
    return <SectionSkeleton title="Synastry Visualizer" />;
  }

  if (error || !synastryData) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 text-center backdrop-blur-2xl sm:p-6">
        <p className="text-sm text-red-300/80">
          {error ?? "Synastry görselleştirmesi oluşturulamadı."}
        </p>
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
        insightLines={synastryData.insightLines}
        score={score?.score}
        summary={score?.summary}
        date={score?.date}
      />

      {score ? (
        <div className="mt-3 flex justify-center">
          <SynastryShareButton
            data={{
              userName: userData.name,
              partnerName,
              score: score.score,
              summary: score.summary,
              date: score.date,
            }}
          />
        </div>
      ) : null}
    </>
  );
}
