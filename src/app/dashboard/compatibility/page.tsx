"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import { useAuth, useRequireAuth, useUserProfile } from "@/lib/auth";
import {
  fetchSynastryAnalysis,
  fetchSynastryScore,
} from "@/lib/ai/synastry-client";
import {
  getDailyCompatibilityDateKey,
  getDailyCompatibilityQuestions,
} from "@/lib/compatibility/daily-questions";
import { hasPartnerFormData, partnerFormFromUserData } from "@/lib/partner-profile";
import type { SynastryScoreResponse } from "@/lib/ai/synastry";
import SynastryShareButton from "@/components/compatibility/SynastryShareButton";
import { consumeCosmicEnergy, SupabaseActionError } from "@/lib/supabase-actions";

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

function writeCachedScore(score: SynastryScoreResponse): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    `${SCORE_CACHE_PREFIX}${score.date}`,
    JSON.stringify(score)
  );
}

export default function CompatibilityPage() {
  useRequireAuth();
  const { userId } = useAuth();
  const { userData, isLoading: profileLoading, error: profileError } =
    useUserProfile();

  const [score, setScore] = useState<SynastryScoreResponse | null>(null);
  const [isScoreLoading, setIsScoreLoading] = useState(true);
  const [scoreError, setScoreError] = useState<string | null>(null);

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

  const loadDailyScore = useCallback(async () => {
    if (!userData || !hasPartner) {
      setIsScoreLoading(false);
      return;
    }

    setIsScoreLoading(true);
    setScoreError(null);

    const cached = readCachedScore(dateKey);
    if (cached) {
      setScore(cached);
      setIsScoreLoading(false);
      return;
    }

    try {
      const result = await fetchSynastryScore(userData);
      setScore(result);
      writeCachedScore(result);
    } catch (err) {
      setScore(null);
      setScoreError(
        err instanceof Error ? err.message : "Günlük uyum skoru alınamadı."
      );
    } finally {
      setIsScoreLoading(false);
    }
  }, [dateKey, hasPartner, userData]);

  useEffect(() => {
    if (!profileLoading && userData) {
      void loadDailyScore();
    }
  }, [profileLoading, userData, loadDailyScore]);

  const runAnalysis = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || !userData || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    setSelectedQuestion(trimmed);

    try {
      await consumeCosmicEnergy();
      const result = await fetchSynastryAnalysis(trimmed, userData, {
        compatibilityScore: score?.score,
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

  if (profileLoading) {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative flex min-h-dvh items-center justify-center px-4">
          <p className="text-sm text-white/45">Synastry hub yükleniyor...</p>
        </div>
      </main>
    );
  }

  if (!userData) {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
          <p className="text-sm text-white/60">
            {profileError ?? "Profil bilgileri bulunamadı."}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 text-xs uppercase tracking-[0.25em] text-amber-400/70"
          >
            ← Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!hasPartner) {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-[0.25em] text-amber-400/70"
          >
            ← Dashboard
          </Link>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-6 text-center backdrop-blur-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
              Synastry Hub
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">Partner Gerekli</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Uyumluluk analizi için önce partner doğum bilgilerini ekleyin.
            </p>
            <Link
              href="/dashboard/settings"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm font-medium text-amber-100"
            >
              Partner Ayarlarına Git
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh">
      <Starfield />

      <div className="relative mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/dashboard"
          className="text-xs uppercase tracking-[0.25em] text-amber-400/70"
        >
          ← Dashboard
        </Link>

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-amber-400/60">
            Synastry Hub
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Uyumluluk Modeli
          </h1>
          <p className="mt-2 text-sm text-white/45">
            {partner?.partnerName} ile günlük kozmik uyum analizi
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-3 inline-flex min-h-11 items-center text-xs uppercase tracking-[0.2em] text-amber-300/80"
          >
            Partneri Düzenle →
          </Link>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-6 rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
            Günün Uyum Skoru
          </p>

          {isScoreLoading ? (
            <AnalysisSpinner label="Günlük uyum skoru hesaplanıyor..." />
          ) : score ? (
            <div className="mt-4 flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
                <span className="text-4xl font-bold text-amber-100">{score.score}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/75">{score.summary}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
                {score.date}
              </p>
              <SynastryShareButton
                data={{
                  userName: userData.name,
                  partnerName: partner?.partnerName ?? "Partner",
                  score: score.score,
                  summary: score.summary,
                  date: score.date,
                }}
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-center">
              <p className="text-sm text-red-300/80">
                {scoreError ?? "Skor üretilemedi."}
              </p>
              <button
                type="button"
                onClick={() => void loadDailyScore()}
                className="min-h-11 rounded-xl border border-amber-400/30 px-4 py-2 text-sm text-amber-100"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-5 rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
            Hazır Sorular
          </p>
          <p className="mt-2 text-xs text-white/40">Her gün yenilenen 3 ilişki sorusu</p>

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
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-5 rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
        >
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
        </motion.section>

        {(isAnalyzing || analysis || analysisError) && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
          >
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
                {score ? (
                  <SynastryShareButton
                    data={{
                      userName: userData.name,
                      partnerName: partner?.partnerName ?? "Partner",
                      score: score.score,
                      summary: score.summary,
                      date: score.date,
                      question: selectedQuestion,
                      analysisExcerpt: analysis.slice(0, 220),
                    }}
                  />
                ) : null}
              </>
            ) : null}
          </motion.section>
        )}
      </div>
    </main>
  );
}
