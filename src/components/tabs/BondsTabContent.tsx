"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";
import { useAuth, useUserProfile } from "@/lib/auth";
import { fetchSynastryAnalysis } from "@/lib/ai/synastry-client";
import {
  getDailyCompatibilityDateKey,
  getDailyCompatibilityQuestions,
} from "@/lib/compatibility/daily-questions";
import { hasPartnerFormData, partnerFormFromUserData } from "@/lib/partner-profile";
import type { SynastryScoreResponse } from "@/lib/ai/synastry";
import SynastryShareButton from "@/components/compatibility/SynastryShareButton";
import { consumeStarPoints } from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";

const PartnerProfileSection = dynamic(
  () => import("@/components/profile/PartnerProfileSection"),
  { loading: () => <SectionSkeleton title="Partner Profili" /> }
);

const SynastryVisualizerSection = dynamic(
  () => import("@/components/synastry/SynastryVisualizerSection"),
  { loading: () => <SectionSkeleton title="Synastry Visualizer" /> }
);

const SCORE_CACHE_PREFIX = "compatibility_score_";

const fieldClass =
  "mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/30";

const tapButtonClass =
  "min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-white/80 transition hover:border-amber-400/30 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50";

function AnalysisSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        className="h-9 w-9 rounded-full border-2 border-amber-400/15 border-t-amber-400/80"
      />
      <p className="text-sm text-amber-200/70">{label}</p>
    </div>
  );
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

export default function BondsTabContent() {
  const { userId } = useAuth();
  const { userData, error: profileError } = useUserProfile();

  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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
    if (!trimmed || !userData || isAnalyzing || !hasPartner) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    setSelectedQuestion(trimmed);

    try {
      await consumeStarPoints();
      const result = await fetchSynastryAnalysis(trimmed, userData, {
        compatibilityScore: cachedScore?.score,
        partnerName: partner?.partnerName,
      });
      setAnalysis(result.analysis);
    } catch (err) {
      setAnalysisError(
        err instanceof SupabaseActionError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Synastry analizi tamamlanamadı."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomSubmit = (event: FormEvent) => {
    event.preventDefault();
    void runAnalysis(customQuestion);
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
          : "Partner bilgilerinizi ekleyerek uyumluluk analizine başlayın."
      }
      headerExtra={
        hasPartner ? (
          <Link
            href="#partner-profile"
            className="mt-3 inline-flex min-h-11 items-center text-xs uppercase tracking-[0.2em] text-amber-300/80"
          >
            Partneri Düzenle →
          </Link>
        ) : null
      }
    >
      <Suspense fallback={<SectionSkeleton title="Partner Profili" />}>
        <PartnerProfileSection />
      </Suspense>

      {!hasPartner ? (
        <section className="rounded-[28px] border border-amber-400/15 bg-amber-400/[0.04] p-5 text-center">
          <p className="text-sm leading-relaxed text-white/55">
            Partner bilgilerini kaydettikten sonra günlük uyum skoru ve synastry
            analizi burada açılır.
          </p>
        </section>
      ) : (
        <>
          <Suspense fallback={<SectionSkeleton title="Synastry Visualizer" />}>
            <SynastryVisualizerSection
              userData={userData}
              partnerName={partner?.partnerName ?? "Partner"}
              dateKey={dateKey}
            />
          </Suspense>

          <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
              Hazır Sorular
            </p>
            <p className="mt-2 text-xs text-white/40">
              Her gün yenilenen 3 ilişki sorusu
            </p>

            <div className="mt-4 space-y-3">
              {dailyQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={isAnalyzing}
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
                rows={4}
                placeholder="Örn: Bu hafta duygusal olarak birbirimize yaklaşabilir miyiz?"
                disabled={isAnalyzing}
                className={fieldClass}
              />
              <button
                type="submit"
                disabled={isAnalyzing || !customQuestion.trim()}
                className="min-h-11 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm font-medium text-amber-100 disabled:opacity-60"
              >
                Synastry Analizi Al
              </button>
            </form>
          </section>

          {(isAnalyzing || analysis || analysisError) && (
            <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
                Synastry Analizi
              </p>

              {selectedQuestion ? (
                <p className="mt-2 text-xs text-white/45">Soru: {selectedQuestion}</p>
              ) : null}

              {isAnalyzing ? (
                <AnalysisSpinner label="Natal + transit + synastry harmanlanıyor..." />
              ) : analysisError ? (
                <p className="mt-4 text-sm text-red-300/80">{analysisError}</p>
              ) : analysis ? (
                <>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                    {analysis}
                  </p>
                  {cachedScore ? (
                    <SynastryShareButton
                      data={{
                        userName: userData.name,
                        partnerName: partner?.partnerName ?? "Partner",
                        score: cachedScore.score,
                        summary: cachedScore.summary,
                        date: cachedScore.date,
                        question: selectedQuestion,
                        analysisExcerpt: analysis.slice(0, 220),
                      }}
                    />
                  ) : null}
                </>
              ) : null}
            </section>
          )}
        </>
      )}
    </TabPageScaffold>
  );
}
