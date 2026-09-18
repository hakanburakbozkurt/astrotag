"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";
import SubPageNav from "@/components/navigation/SubPageNav";
import ShareButton from "@/components/analysis/ShareButton";
import { splitLegacyAnalysisText } from "@/lib/analysis/parse-oracle-response";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { STAR_POINTS_COST_PER_ACTION } from "@/lib/constants/cosmic";
import { runHoraryReading } from "@/lib/actions/horary-reading";
import { getStarPoints } from "@/lib/supabase-actions";
import { STAR_POINTS_UPDATED_EVENT } from "@/lib/energy-events";
import OracleModuleErrorBoundary from "@/components/oracle/OracleModuleErrorBoundary";
import {
  compactEyebrowClass,
  compactPageClass,
  compactPageTitleClass,
  compactSectionClass,
} from "@/components/navigation/compact-ui";
import { ORACLE_COSMIC_DATA_ERROR, logOracleModuleError } from "@/lib/oracle/oracle-errors";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";
import {
  noirBodyClass,
  noirPrimaryButtonClass,
  noirSecondaryButtonClass,
} from "@/lib/theme/noir-tokens";

const ORACLE_ROOT = "/dashboard/oracle";
const HORARY_ERROR_MESSAGE = ORACLE_COSMIC_DATA_ERROR;

function HorarySpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        className="h-10 w-10 rounded-full border-2 border-zinc-800 border-t-stone-400"
      />
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-sm tracking-wide text-stone-500"
      >
        Yıldızlar hizalanıyor...
      </motion.p>
    </div>
  );
}

export default function HoraryPage() {
  useRequireAuth();
  const router = useRouter();
  const { userData, profileStatus, isPending: profileLoading, error: profileError } =
    useUserProfile();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [starPoints, setStarPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!profileLoading && userData) {
      void (async () => {
        try {
          const points = await getStarPoints();
          setStarPoints(points);
        } catch {
          setStarPoints(userData.starPoints ?? 0);
        }
      })();
    }
  }, [profileLoading, userData]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed || isLoading || !userData) {
      return;
    }

    if (starPoints < STAR_POINTS_COST_PER_ACTION) {
      setError(
        `Bu işlem için ${STAR_POINTS_COST_PER_ACTION} yıldız gerekir. Mevcut: ${starPoints}`
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnswer(null);
    setHasSubmitted(true);

    try {
      const result = await runHoraryReading(trimmed);

      if (!result.success) {
        if (result.redirectTo) {
          router.push(result.redirectTo);
          return;
        }
        setError(result.error);
        setHasSubmitted(false);
        return;
      }

      setAnswer(result.answer);
      setStarPoints(result.remainingStars);
      window.dispatchEvent(
        new CustomEvent(STAR_POINTS_UPDATED_EVENT, {
          detail: { starPoints: result.remainingStars },
        })
      );
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        String((err as { digest?: string }).digest ?? "").includes("NEXT_REDIRECT")
      ) {
        router.push(PROFILE_SETUP_PATH);
        return;
      }

      logOracleModuleError("horary", err, { question: trimmed });
      setError(HORARY_ERROR_MESSAGE);
      setHasSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
    return <TabPageSkeleton />;
  }

  if (profileStatus === "error" || profileStatus === "empty" || !userData) {
    return (
      <div className="relative mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm text-stone-500">
          {profileError ?? "Profil bilgileri bulunamadı."}
        </p>
        <Link
          href="/dashboard"
          className={`mt-6 ${noirSecondaryButtonClass} w-auto px-5`}
        >
          Ana Sayfa
        </Link>
      </div>
    );
  }

  return (
    <OracleModuleErrorBoundary module="horary">
      <div className={compactPageClass}>
      <SubPageNav backHref="/dashboard" closeHref="/dashboard/natal" />

      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <p className={compactEyebrowClass}>Horary Astrology</p>
        <h1 className={`${compactPageTitleClass} text-stone-100`}>
          Anlık Kozmik Soru
        </h1>
        <p className="mt-3 text-sm text-stone-500">
          Kullanılabilir Yıldız: {starPoints}
        </p>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={`${compactSectionClass} p-5 sm:p-6`}
      >
        {!hasSubmitted || (!isLoading && !answer && error) ? (
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
            <label htmlFor="horary-question" className="block">
              <span className="text-xs text-stone-300">Sorunuz</span>
              <textarea
                id="horary-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={4}
                placeholder="Örn: Bu teklif kabul edilmeli mi?"
                disabled={isLoading}
                className="mt-2 w-full resize-none rounded-sm border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-stone-300 outline-none transition placeholder:text-stone-500 focus:border-zinc-600"
              />
            </label>

            {error ? <p className="text-sm text-stone-500">{error}</p> : null}

            <button
              type="submit"
              disabled={
                isLoading ||
                !question.trim() ||
                starPoints < STAR_POINTS_COST_PER_ACTION
              }
              className={noirPrimaryButtonClass}
            >
              Yıldızlara Sor (−1 Yıldız)
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
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-stone-300">Kozmik Yanıt</p>
              <ShareButton
                executiveSummary={splitLegacyAnalysisText(answer).executiveSummary}
                moduleId="horary"
                moduleLabel="Horary"
                content={{ question: question.trim() || undefined }}
              />
            </div>
            <p className={`whitespace-pre-wrap ${noirBodyClass}`}>
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
              className={noirSecondaryButtonClass}
            >
              Yeni Soru Sor
            </button>
          </motion.div>
        ) : null}
      </motion.section>
    </div>
    </OracleModuleErrorBoundary>
  );
}
