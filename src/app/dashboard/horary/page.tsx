"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import {
  ENERGY_COST_PER_ACTION,
} from "@/lib/constants/cosmic";
import { fetchHoraryReading } from "@/lib/ai/horary-client";
import { submitHoraryQuestion } from "@/lib/submit-question";
import {
  getCosmicEnergy,
  getHoraryQuestion,
  SupabaseActionError,
  updateHoraryAnswer,
} from "@/lib/supabase-actions";

const HORARY_ERROR_MESSAGE =
  "Yıldızlar şu an sessiz, lütfen tekrar dene.";

function HorarySpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        className="h-10 w-10 rounded-full border-2 border-amber-400/15 border-t-amber-400/80"
      />
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-sm tracking-wide text-amber-200/70"
      >
        Yıldızlar hizalanıyor...
      </motion.p>
    </div>
  );
}

export default function HoraryPage() {
  useRequireAuth();
  const router = useRouter();
  const { userData, profileStatus, isLoading: profileLoading, error: profileError } =
    useUserProfile();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [energy, setEnergy] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!profileLoading && userData) {
      void getCosmicEnergy()
        .then(setEnergy)
        .catch(() => setEnergy(userData.cosmicEnergy ?? 0));
    }
  }, [profileLoading, userData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed || isLoading || !userData) {
      return;
    }

    if (energy < ENERGY_COST_PER_ACTION) {
      setError(
        `Bu işlem için ${ENERGY_COST_PER_ACTION} enerji gerekir. Mevcut: ${energy}`
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnswer(null);
    setHasSubmitted(true);

    try {
      const record = await submitHoraryQuestion(trimmed);
      const aiResult = await fetchHoraryReading(trimmed, userData);

      await updateHoraryAnswer(
        record.id,
        aiResult.answer,
        aiResult.cosmicContext ?? null
      );

      const saved = await getHoraryQuestion(record.id);
      if (!saved?.ai_answer?.trim()) {
        throw new SupabaseActionError("Cevap veritabanından alınamadı.");
      }

      setAnswer(saved.ai_answer);
      setEnergy((current) => Math.max(0, current - ENERGY_COST_PER_ACTION));
    } catch (err) {
      const message =
        err instanceof SupabaseActionError
          ? err.message
          : err instanceof Error
            ? err.message
            : HORARY_ERROR_MESSAGE;
      setError(message);
      setHasSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative flex min-h-dvh items-center justify-center px-4">
          <p className="text-sm text-white/45">Kozmik bağlantı kuruluyor...</p>
        </div>
      </main>
    );
  }

  if (profileStatus === "error" || profileStatus === "empty" || !userData) {
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

  return (
    <main className="relative min-h-dvh">
      <Starfield />

      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center text-xs uppercase tracking-[0.25em] text-amber-400/70 transition hover:text-amber-300"
          >
            ← Dashboard
          </Link>

          <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.35em] text-amber-400/60">
            Horary Astrology
          </p>
          <h1 className="mt-2 bg-gradient-to-b from-white to-amber-200/80 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Anlık Kozmik Soru
          </h1>
          <p className="mt-3 text-sm text-white/40">
            Kullanılabilir enerji: {energy}
          </p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
        >
          {!hasSubmitted || (!isLoading && !answer && error) ? (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <label htmlFor="horary-question" className="block">
                <span className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
                  Sorunuz
                </span>
                <textarea
                  id="horary-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={4}
                  placeholder="Örn: Bu teklif kabul edilmeli mi?"
                  disabled={isLoading}
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-amber-400/30"
                />
              </label>

              {error ? (
                <p className="text-sm text-red-300/80">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={
                  isLoading ||
                  !question.trim() ||
                  energy < ENERGY_COST_PER_ACTION
                }
                className="w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Yıldızlara Sor (−1 Enerji)
              </button>
            </form>
          ) : null}

          {isLoading ? <HorarySpinner /> : null}

          {!isLoading && answer ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
                Kozmik Yanıt
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {answer}
              </p>
              <button
                type="button"
                onClick={() => {
                  setHasSubmitted(false);
                  setAnswer(null);
                  setQuestion("");
                  setError(null);
                }}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 transition hover:border-amber-400/25 hover:text-amber-100"
              >
                Yeni Soru Sor
              </button>
            </motion.div>
          ) : null}
        </motion.section>
      </div>
    </main>
  );
}
