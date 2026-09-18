"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShareButton from "@/components/analysis/ShareButton";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import CosmicProfilePersonFields from "@/components/dashboard/CosmicProfilePersonFields";
import { splitLegacyAnalysisText } from "@/lib/analysis/parse-oracle-response";
import {
  runCosmicProfileAnalysis,
  saveCosmicProfileToJournal,
  submitCosmicProfileFeedback,
} from "@/lib/actions/cosmic-profile";
import {
  getDefaultCosmicProfileTier,
  type CosmicProfilePersonInput,
  type CosmicProfileTierId,
} from "@/lib/cosmic-profile/types";
import { STAR_PACKAGES_PATH } from "@/lib/constants/cosmic";
import { STAR_POINTS_UPDATED_EVENT } from "@/lib/energy-events";
import { useStarEconomy } from "@/hooks/useStarEconomy";
import type { UserData } from "@/types/user";
import {
  compactEyebrowClass,
  compactPageTitleClass,
} from "@/components/navigation/compact-ui";
import {
  noirBodyClass,
  noirInlineButtonClass,
  noirLabelClass,
  noirPrimaryButtonClass,
  noirSecondaryButtonClass,
} from "@/lib/theme/noir-tokens";

const PRIVACY_NOTICE =
  "Analiz, bu ekranda girdiğiniz doğum verileriyle hesaplanır. Kozmik Günlüğünüze yalnızca siz onay verdiğinizde şifreli olarak kaydedilir.";

const STANDARD_TIER = getDefaultCosmicProfileTier();
const ANALYSIS_STAR_COST = STANDARD_TIER.stars;

const FIELD_INPUT_CLASS =
  "w-full rounded-sm border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-stone-300 outline-none transition placeholder:text-stone-500 focus:border-zinc-600";

const FIELD_TEXTAREA_CLASS =
  "min-h-[96px] w-full resize-y rounded-sm border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm leading-relaxed text-stone-300 outline-none transition placeholder:text-stone-500 focus:border-zinc-600";

const OPTION_ACTIVE_CLASS =
  "rounded-sm border border-zinc-600 bg-zinc-900 text-stone-300";

const OPTION_INACTIVE_CLASS =
  "rounded-sm border border-zinc-800 bg-zinc-950 text-stone-500 hover:border-zinc-700 hover:text-stone-400";

function personFromUser(user: UserData, who: "self" | "partner"): CosmicProfilePersonInput {
  if (who === "partner") {
    return {
      name: user.partnerName?.trim() ?? "",
      birthDate: user.partnerBirthDate ?? "",
      birthTime: user.partnerBirthTime ?? "",
      birthPlace: user.partnerBirthPlace ?? "",
    };
  }

  return {
    name: user.name,
    birthDate: user.birthDate,
    birthTime: user.birthTime,
    birthPlace: user.birthPlace,
  };
}

function isPersonComplete(person: CosmicProfilePersonInput): boolean {
  return Boolean(
    person.name.trim() &&
      person.birthDate.trim() &&
      person.birthTime.trim() &&
      person.birthPlace.trim()
  );
}

interface CosmicProfilePanelProps {
  user: UserData;
  onClose: () => void;
  presentation?: "modal" | "inline";
}

type AnalysisState = {
  reading: string;
  sessionId: string;
  tier: CosmicProfileTierId;
  subjectName: string;
  birthPlace: string;
};

export default function CosmicProfilePanel({
  user,
  onClose,
  presentation = "modal",
}: CosmicProfilePanelProps) {
  const router = useRouter();
  const [subject, setSubject] = useState<"self" | "partner">("self");
  const [selfPerson, setSelfPerson] = useState(() => personFromUser(user, "self"));
  const [partnerPerson, setPartnerPerson] = useState(() => personFromUser(user, "partner"));
  const [relationshipType, setRelationshipType] = useState(user.relationshipStatus ?? "");
  const [analysisQuestion, setAnalysisQuestion] = useState("");
  const { totalStarPoints, refresh: refreshStarEconomy } = useStarEconomy();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [savedToJournal, setSavedToJournal] = useState(false);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);

  const activePerson = subject === "self" ? selfPerson : partnerPerson;
  const canSubmit = isPersonComplete(activePerson) && totalStarPoints >= ANALYSIS_STAR_COST;

  const subjectLabel = useMemo(
    () => (subject === "self" ? "Kişi 1" : "Kişi 2"),
    [subject]
  );

  function notifyStarPointsUpdated(next: number) {
    window.dispatchEvent(
      new CustomEvent(STAR_POINTS_UPDATED_EVENT, { detail: { starPoints: next } })
    );
    void refreshStarEconomy();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || !canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    setAnalysis(null);
    setFeedbackDone(false);
    setCanSave(false);
    setSavedToJournal(false);
    setRefundMessage(null);

    const result = await runCosmicProfileAnalysis({
      subject,
      relationshipType: relationshipType || undefined,
      question: analysisQuestion.trim() || undefined,
      self: selfPerson,
      partner: partnerPerson,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
      return;
    }

    notifyStarPointsUpdated(result.remainingStars);
    setAnalysis({
      reading: result.reading,
      sessionId: result.sessionId,
      tier: result.tier,
      subjectName: result.subjectName,
      birthPlace: result.birthPlace,
    });
  }

  async function handleSaveToJournal() {
    if (!analysis || savedToJournal) return;

    const result = await saveCosmicProfileToJournal({
      sessionId: analysis.sessionId,
      reading: analysis.reading,
      tier: analysis.tier,
      subjectName: analysis.subjectName,
      birthPlace: analysis.birthPlace,
    });

    if (!result.success) {
      setError(result.error ?? "Kayıt başarısız.");
      return;
    }

    setSavedToJournal(true);
  }

  const panelBody = (
    <div
      className={
        presentation === "inline"
          ? "w-full min-w-0 space-y-6"
          : "max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-sm border border-zinc-800 bg-zinc-900 p-6 sm:p-8"
      }
    >
      {presentation === "inline" ? (
        <header>
          <p className="text-xs tracking-wide text-stone-500">Oracle Profil</p>
          <h2 className="mt-1 font-[family-name:var(--font-serif-display)] text-xl font-normal text-white sm:text-2xl">
            Kozmik Profil
          </h2>
          <p className="mt-2 text-sm text-stone-400">
            Kapsamlı tek analiz · {ANALYSIS_STAR_COST} yıldız
          </p>
        </header>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={compactEyebrowClass}>Oracle Profil</p>
            <h2 className={`${compactPageTitleClass} text-stone-100`}>Kozmik Profil</h2>
            <p className="mt-1 text-xs text-stone-500">
              Kapsamlı tek analiz · {ANALYSIS_STAR_COST} yıldız
            </p>
          </div>
          <button type="button" onClick={onClose} className={noirInlineButtonClass}>
            Kapat
          </button>
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-stone-500">
        Kullanılabilir Yıldız:{" "}
        <span className="text-stone-300">{totalStarPoints}</span>
      </p>

      {!analysis ? (
        <form onSubmit={handleSubmit} className="mt-6 flex w-full min-w-0 flex-col gap-4">
          <CosmicProfilePersonFields
            idPrefix="self"
            title="Kişi 1"
            hint="Ana profil bilgileri. Gerekirse güncelleyebilirsiniz."
            value={selfPerson}
            onChange={setSelfPerson}
          />

          <CosmicProfilePersonFields
            idPrefix="partner"
            title="Kişi 2 / Partner"
            hint="İkinci kişi (İlişki ve synastry analizleri için opsiyonel)."
            value={partnerPerson}
            onChange={setPartnerPerson}
          />

          <label className="flex w-full flex-col gap-1">
            <span className={noirLabelClass}>İlişki Türü</span>
            <select
              value={relationshipType}
              onChange={(event) => setRelationshipType(event.target.value)}
              className={FIELD_INPUT_CLASS}
            >
              <option value="">Seçin (opsiyonel)</option>
              <option value="Flört">Flört</option>
              <option value="Arkadaş">Arkadaş</option>
              <option value="Sevgili">Sevgili</option>
              <option value="İş Arkadaşı">İş Arkadaşı</option>
              <option value="Aile">Aile</option>
            </select>
          </label>

          <div className="flex w-full flex-col gap-2">
            <span className={noirLabelClass}>Analiz Konusu</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSubject("self")}
                className={`border px-3 py-2.5 text-sm transition ${
                  subject === "self" ? OPTION_ACTIVE_CLASS : OPTION_INACTIVE_CLASS
                }`}
              >
                Kişi 1
              </button>
              <button
                type="button"
                onClick={() => setSubject("partner")}
                className={`border px-3 py-2.5 text-sm transition ${
                  subject === "partner" ? OPTION_ACTIVE_CLASS : OPTION_INACTIVE_CLASS
                }`}
              >
                Kişi 2
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Seçili analiz: <span className="text-stone-300">{subjectLabel}</span>
              {!isPersonComplete(activePerson) ? (
                <span className="text-stone-500"> — eksik alanları tamamlayın</span>
              ) : null}
            </p>
          </div>

          <label htmlFor="cosmic-profile-question" className="flex w-full flex-col gap-1">
            <span className={noirLabelClass}>Analiz Sorusu / Niyet</span>
            <textarea
              id="cosmic-profile-question"
              value={analysisQuestion}
              onChange={(event) => setAnalysisQuestion(event.target.value)}
              rows={3}
              placeholder="Aklınızdaki soru veya odaklanmak istediğiniz konu..."
              disabled={isSubmitting}
              className={FIELD_TEXTAREA_CLASS}
            />
          </label>

          {error ? (
            <p className="rounded-sm border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-stone-500">
              {error}
              {error.includes("yıldız") ? (
                <>
                  {" "}
                  <Link href={STAR_PACKAGES_PATH} className="underline">
                    Yıldız Paketi
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className={noirPrimaryButtonClass}
          >
            {isSubmitting
              ? "Kozmik imza hesaplanıyor…"
              : `Analizi Başlat (−${ANALYSIS_STAR_COST} Yıldız)`}
          </button>

          {totalStarPoints < ANALYSIS_STAR_COST ? (
            <p className="text-center text-xs text-stone-500">
              Yetersiz yıldız.{" "}
              <Link href={STAR_PACKAGES_PATH} className="underline text-stone-300">
                Yıldız Paketi
              </Link>
            </p>
          ) : null}
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-sm border border-zinc-800 bg-zinc-950 px-4 py-3">
            <p className="text-xs leading-relaxed text-stone-500">{PRIVACY_NOTICE}</p>
          </div>

          <div className="rounded-sm border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-stone-300">Kozmik Mesaj</p>
              <ShareButton
                executiveSummary={
                  splitLegacyAnalysisText(analysis.reading).executiveSummary
                }
                moduleId="cosmic-profile"
                moduleLabel="Kozmik Profil"
                content={{
                  subtitle: `${analysis.subjectName} · ${analysis.birthPlace}`,
                }}
              />
            </div>
            <p className={`mt-3 whitespace-pre-wrap ${noirBodyClass}`}>{analysis.reading}</p>
          </div>

          {!feedbackDone ? (
            <FeedbackButton
              module="cosmic-profile"
              referenceId={analysis.sessionId}
              tier={analysis.tier}
              metadata={{
                subjectName: analysis.subjectName,
                birthPlace: analysis.birthPlace,
              }}
              onSubmit={async (rating) => {
                const result = await submitCosmicProfileFeedback({
                  sessionId: analysis.sessionId,
                  rating,
                  tier: analysis.tier,
                  subjectName: analysis.subjectName,
                  birthPlace: analysis.birthPlace,
                  readingPreview: analysis.reading,
                });

                if (result.success) {
                  setFeedbackDone(true);

                  if (result.remainingStars !== undefined) {
                    notifyStarPointsUpdated(result.remainingStars);
                  }

                  if (result.refundedStars && result.remainingStars !== undefined) {
                    setRefundMessage(`${result.refundedStars} yıldız hesabınıza iade edildi.`);
                    setAnalysis(null);
                  } else if (result.canSave) {
                    setCanSave(true);
                  }
                }

                return {
                  success: result.success,
                  feedbackCount: result.feedbackCount,
                  totalStarPoints: result.remainingStars,
                  earnedBadges: result.earnedBadges,
                  milestoneReached: (result.earnedBadges?.length ?? 0) > 0,
                  starsEarned: result.earnedBadges?.reduce(
                    (sum, badge) => sum + badge.starReward,
                    0
                  ),
                  error: result.error,
                };
              }}
            />
          ) : null}

          {canSave && !savedToJournal ? (
            <button
              type="button"
              onClick={() => void handleSaveToJournal()}
              className={noirPrimaryButtonClass}
            >
              Kozmik Günlüğüme Kaydet
            </button>
          ) : null}

          {savedToJournal ? (
            <p className="text-center text-sm text-stone-300">
              Analiz Kozmik Günlüğünüze şifreli olarak kaydedildi.
            </p>
          ) : null}

          {refundMessage ? (
            <p className="text-center text-sm text-stone-300">{refundMessage}</p>
          ) : null}

          {feedbackDone && canSave ? (
            <button
              type="button"
              onClick={() => {
                setAnalysis(null);
                setFeedbackDone(false);
                setCanSave(false);
                setAnalysisQuestion("");
              }}
              className={noirSecondaryButtonClass}
            >
              Yeni Analiz
            </button>
          ) : null}
        </div>
      )}
    </div>
  );

  if (presentation === "inline") {
    return panelBody;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        onClick={(event) => event.stopPropagation()}
      >
        {panelBody}
      </motion.div>
    </motion.div>
  );
}
