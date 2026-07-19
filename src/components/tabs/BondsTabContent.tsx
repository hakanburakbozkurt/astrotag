"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import AnalysisResults from "@/components/analysis/AnalysisResults";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";
import { compactTapButtonClass } from "@/components/navigation/compact-ui";
import { useAuth, useUserProfile } from "@/lib/auth";
import { fetchSynastryAnalysis } from "@/lib/ai/synastry-client";
import {
  getDailyCompatibilityDateKey,
  getDailyCompatibilityQuestions,
} from "@/lib/compatibility/daily-questions";
import { hasPartnerFormData, partnerFormFromUserData } from "@/lib/partner-profile";
import type { SynastryScoreResponse } from "@/lib/ai/synastry";
import type { AnalysisUiStatus, OracleAnalysisPresentation } from "@/lib/analysis/types";
import { usePaidAnalysis } from "@/hooks/usePaidAnalysis";

const SynastryVisualizerSection = dynamic(
  () => import("@/components/synastry/SynastryVisualizerSection"),
  { loading: () => <SectionSkeleton title="Synastry Visualizer" /> }
);

const SCORE_CACHE_PREFIX = "compatibility_score_";

const fieldClass =
  "mt-1.5 box-border block min-h-[140px] w-full min-w-0 resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/30";
const tapButtonClass = `${compactTapButtonClass} w-full text-left text-white/80 hover:border-amber-400/30 hover:bg-white/[0.06]`;

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

export default function BondsTabContent() {
  const { userId } = useAuth();
  const { userData, error: profileError } = useUserProfile();
  const {
    totalStarPoints,
    detailsUnlocked,
    isUnlocking,
    unlockError,
    unlockDetails,
    resetUnlock,
  } = usePaidAnalysis();

  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [presentation, setPresentation] = useState<OracleAnalysisPresentation | null>(
    null
  );
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisUiStatus>("idle");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const feedbackReferenceId = useRef<string | null>(null);

  const dateKey = getDailyCompatibilityDateKey();
  const partner = userData ? partnerFormFromUserData(userData) : null;
  const hasPartner = partner ? hasPartnerFormData(partner) : false;

  const dailyQuestions = useMemo(
    () => getDailyCompatibilityQuestions(new Date(), userId ?? "guest"),
    [userId]
  );
  const cachedScore = readCachedScore(dateKey);

  const runAnalysis = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || !userData || analysisStatus === "loading" || !hasPartner) return;

    setAnalysisStatus("loading");
    setAnalysisError(null);
    setPresentation(null);
    setSelectedQuestion(trimmed);
    resetUnlock();

    try {
      const result = await fetchSynastryAnalysis(trimmed, userData, {
        compatibilityScore: cachedScore?.score,
        partnerName: partner?.partnerName,
      });
      setPresentation(result.presentation);
      feedbackReferenceId.current = crypto.randomUUID();
      setAnalysisStatus("ready");
    } catch (err) {
      setAnalysisStatus("error");
      setAnalysisError(
        err instanceof Error ? err.message : "Synastry analizi tamamlanamadı."
      );
    }
  };

  const handleCustomSubmit = (event: FormEvent) => {
    event.preventDefault();
    void runAnalysis(customQuestion);
  };

  const handleUnlockDetails = () => {
    if (!presentation) {
      return;
    }

    void unlockDetails(presentation.cost);
  };

  if (!userData) {
    return (
      <div className="relative mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm text-white/60">
          {profileError ?? "Profil bilgileri bulunamadı."}
        </p>
      </div>
    );
  }

  return (
    <TabPageScaffold
      eyebrow="Cosmic Bonds"
      title={hasPartner ? "Uyumluluk Modeli" : "Partner Bağlantısı"}
      description={
        hasPartner
          ? `${partner?.partnerName} ile günlük kozmik uyum analizi`
          : "Partner bilgilerinizi profilden ekleyerek uyumluluk analizine başlayın."
      }
      headerExtra={
        <Link
          href="/dashboard/profile#bond-partner"
          className="mt-3 inline-flex min-h-11 items-center text-xs uppercase tracking-[0.2em] text-amber-300/80"
        >
          {hasPartner ? "Partneri Düzenle →" : "Profile Git →"}
        </Link>
      }
    >
      {!hasPartner ? (
        <section className="rounded-[28px] border border-amber-400/15 bg-amber-400/[0.04] p-5 text-center">
          <p className="text-sm leading-relaxed text-white/55">
            Partner ve Astro-Bağ bilgilerini Profil sekmesinden kaydettikten sonra
            günlük uyum skoru ve synastry analizi burada açılır.
          </p>
          <Link
            href="/dashboard/profile#bond-partner"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 text-xs font-medium uppercase tracking-[0.16em] text-amber-100"
          >
            Partner Ekle
          </Link>
        </section>
      ) : (
        <>
          <Suspense fallback={<SectionSkeleton title="Synastry Visualizer" />}>
            <SynastryVisualizerSection
              userData={userData}
              partnerName={partner?.partnerName ?? "Partner"}
              dateKey={dateKey}
              shareContext={
                presentation
                  ? {
                      question: selectedQuestion || undefined,
                      analysisExcerpt: presentation.executiveSummary.slice(0, 220),
                    }
                  : undefined
              }
            />
          </Suspense>

          <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
              Hazır Sorular
            </p>
            <p className="mt-2 text-xs text-white/40">
              Her gün yenilenen 3 ilişki sorusu · özet ücretsiz
            </p>

            <div className="mt-4 space-y-3">
              {dailyQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={analysisStatus === "loading"}
                  onClick={() => void runAnalysis(question)}
                  className={tapButtonClass}
                >
                  {question}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
              Kendi Sorunu Yaz
            </p>

            <form onSubmit={handleCustomSubmit} className="mt-4 space-y-4">
              <textarea
                value={customQuestion}
                onChange={(event) => setCustomQuestion(event.target.value)}
                rows={6}
                placeholder="Örn: Bu hafta duygusal olarak birbirimize yaklaşabilir miyiz?"
                disabled={analysisStatus === "loading"}
                className={fieldClass}
              />
              <button
                type="submit"
                disabled={analysisStatus === "loading" || !customQuestion.trim()}
                className="min-h-11 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm font-medium text-amber-100 disabled:opacity-60"
              >
                Synastry Özetini Al
              </button>
            </form>
          </section>

          <AnalysisResults
            status={analysisStatus}
            presentation={presentation}
            error={analysisError}
            detailsUnlocked={detailsUnlocked}
            isUnlocking={isUnlocking}
            unlockError={unlockError}
            totalStarPoints={totalStarPoints}
            onUnlockDetails={handleUnlockDetails}
            moduleLabel="Synastry Analizi"
            loadingLabel="Natal + transit + synastry harmanlanıyor..."
            share={{
              moduleId: "synastry",
              moduleLabel: "Synastry",
              content: {
                score: cachedScore?.score,
                scoreLabel: "Uyum Skoru",
                subtitle: partner?.partnerName,
                question: selectedQuestion || undefined,
              },
            }}
            feedback={{
              module: "synastry",
              referenceId: feedbackReferenceId.current ?? undefined,
              metadata: {
                question: selectedQuestion || undefined,
                partnerName: partner?.partnerName,
              },
            }}
          />
        </>
      )}
    </TabPageScaffold>
  );
}
