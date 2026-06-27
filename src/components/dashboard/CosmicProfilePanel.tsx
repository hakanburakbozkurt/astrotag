"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { citiesData } from "@/data/cities.js";
import {
  runCosmicProfileAnalysis,
  saveCosmicProfileToJournal,
  submitCosmicProfileFeedback,
} from "@/lib/actions/cosmic-profile";
import { type CosmicProfileTierId } from "@/lib/cosmic-profile/types";
import { STAR_PACKAGES_PATH } from "@/lib/constants/cosmic";
import { STAR_POINTS_UPDATED_EVENT } from "@/lib/energy-events";
import { getStarPoints } from "@/lib/supabase-actions";
import type { UserData } from "@/types/user";

const PRIVACY_NOTICE =
  "Bu veriler analiz için geçicidir ve kaydedilmemiştir. Kozmik Günlüğünüze yalnızca siz onay verdiğinizde şifreli olarak kaydedilir.";

const FIELD_LABEL_CLASS = "block text-[10px] uppercase tracking-[0.2em] text-white/40";
const FIELD_INPUT_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/30";

const DERINLIK_SECENEKLERI: {
  id: CosmicProfileTierId;
  stars: number;
  label: string;
}[] = [
  { id: "entry", stars: 5, label: "5 Yıldız - Hızlı Analiz" },
  { id: "depth", stars: 8, label: "8 Yıldız - Derin Analiz" },
  { id: "master", stars: 12, label: "12 Yıldız - Detaylı & Detaylı Astro-Analiz" },
];

interface CosmicProfilePanelProps {
  user: UserData;
  onClose: () => void;
}

type AnalysisState = {
  reading: string;
  sessionId: string;
  tier: CosmicProfileTierId;
  subjectName: string;
  birthPlace: string;
};

export default function CosmicProfilePanel({ user, onClose }: CosmicProfilePanelProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [birthDistrict, setBirthDistrict] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [derinlikSeviyesi, setDerinlikSeviyesi] = useState<CosmicProfileTierId | "">("");
  const [starPoints, setStarPoints] = useState(user.starPoints + user.starPointsBonus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [savedToJournal, setSavedToJournal] = useState(false);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);

  const districtOptions = useMemo(() => {
    if (!birthCity) return [];
    return citiesData.find((city) => city.name === birthCity)?.districts ?? [];
  }, [birthCity]);

  useEffect(() => {
    void getStarPoints().then(setStarPoints).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!birthDistrict) return;
    if (!districtOptions.includes(birthDistrict)) {
      setBirthDistrict("");
    }
  }, [birthCity, birthDistrict, districtOptions]);

  function notifyStarPointsUpdated(next: number) {
    setStarPoints(next);
    window.dispatchEvent(
      new CustomEvent(STAR_POINTS_UPDATED_EVENT, { detail: { starPoints: next } })
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || !derinlikSeviyesi) return;

    setIsSubmitting(true);
    setError(null);
    setAnalysis(null);
    setFeedbackDone(false);
    setCanSave(false);
    setSavedToJournal(false);
    setRefundMessage(null);

    const result = await runCosmicProfileAnalysis({
      name,
      birthDate,
      birthTime,
      birthCity,
      birthDistrict,
      tier: derinlikSeviyesi,
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

  async function handleFeedback(accurate: boolean) {
    if (!analysis || feedbackDone) return;

    const result = await submitCosmicProfileFeedback({
      sessionId: analysis.sessionId,
      accurate,
      tier: analysis.tier,
      subjectName: analysis.subjectName,
      birthPlace: analysis.birthPlace,
      readingPreview: analysis.reading,
    });

    setFeedbackDone(true);

    if (!result.success) {
      setError(result.error ?? "Geri bildirim kaydedilemedi.");
      return;
    }

    if (result.refundedStars && result.remainingStars !== undefined) {
      notifyStarPointsUpdated(result.remainingStars);
      setRefundMessage(`${result.refundedStars} yıldız hesabınıza iade edildi.`);
      setAnalysis(null);
      return;
    }

    if (result.canSave) {
      setCanSave(true);
    }
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

  const selectedDepth = DERINLIK_SECENEKLERI.find((item) => item.id === derinlikSeviyesi);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0f172a]/95 p-6 backdrop-blur-2xl sm:rounded-[28px] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
              Oracle Profil
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Kozmik Profil</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:text-white"
          >
            Kapat
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-white/45">
          Kullanılabilir Yıldız:{" "}
          <span className="text-amber-200/90">{starPoints}</span>
        </p>

        {!analysis ? (
          <form onSubmit={handleSubmit} className="mt-6 flex w-full flex-col gap-3">
            <label className="flex w-full flex-col gap-1">
              <span className={FIELD_LABEL_CLASS}>İsim</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Adınızı girin"
                className={FIELD_INPUT_CLASS}
                required
              />
            </label>

            <div className="grid w-full grid-cols-2 gap-4">
              <label className="flex min-w-0 w-full flex-col gap-1">
                <span className={FIELD_LABEL_CLASS}>Doğum Tarihi</span>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className={`${FIELD_INPUT_CLASS} min-w-0`}
                  required
                />
              </label>
              <label className="flex min-w-0 w-full flex-col gap-1">
                <span className={FIELD_LABEL_CLASS}>Doğum Saati</span>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(event) => setBirthTime(event.target.value)}
                  className={`${FIELD_INPUT_CLASS} min-w-0`}
                  required
                />
              </label>
            </div>

            <label className="flex w-full flex-col gap-1">
              <span className={FIELD_LABEL_CLASS}>İlişki Türü</span>
              <select
                value={relationshipType}
                onChange={(event) => setRelationshipType(event.target.value)}
                className={FIELD_INPUT_CLASS}
                required
              >
                <option value="">Seçin</option>
                <option value="Flört">Flört</option>
                <option value="Arkadaş">Arkadaş</option>
                <option value="Sevgili">Sevgili</option>
                <option value="İş Arkadaşı">İş Arkadaşı</option>
                <option value="Aile">Aile</option>
              </select>
            </label>

            <div className="grid w-full grid-cols-2 gap-4">
              <label className="flex w-full flex-col gap-1">
                <span className={FIELD_LABEL_CLASS}>İl</span>
                <select
                  value={birthCity}
                  onChange={(event) => setBirthCity(event.target.value)}
                  className={FIELD_INPUT_CLASS}
                  required
                >
                  <option value="">Seçin</option>
                  {citiesData.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex w-full flex-col gap-1">
                <span className={FIELD_LABEL_CLASS}>İlçe</span>
                <select
                  value={birthDistrict}
                  onChange={(event) => setBirthDistrict(event.target.value)}
                  className={FIELD_INPUT_CLASS}
                  required
                  disabled={!birthCity}
                >
                  <option value="">Seçin</option>
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex w-full flex-col gap-2">
              <span className={FIELD_LABEL_CLASS}>Analiz Derinliği</span>
              <div className="flex w-full flex-col gap-2" role="radiogroup" aria-label="Analiz derinliği">
                {DERINLIK_SECENEKLERI.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={derinlikSeviyesi === item.id}
                    onClick={() => setDerinlikSeviyesi(item.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      derinlikSeviyesi === item.id
                        ? "border-amber-400/40 bg-amber-400/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <span className="text-sm font-medium text-white">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200/90">
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
              disabled={
                isSubmitting ||
                !derinlikSeviyesi ||
                (selectedDepth !== undefined && starPoints < selectedDepth.stars)
              }
              className="w-full rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-[#0f172a] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Kozmik imza hesaplanıyor…"
                : selectedDepth
                  ? `Analizi Başlat (−${selectedDepth.stars} Yıldız)`
                  : "Analizi Başlat"}
            </button>

            {selectedDepth && starPoints < selectedDepth.stars ? (
              <p className="text-center text-xs text-amber-200/70">
                Yetersiz yıldız.{" "}
                <Link href={STAR_PACKAGES_PATH} className="underline">
                  Yıldız Paketi
                </Link>
              </p>
            ) : null}
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-sky-400/20 bg-sky-400/[0.06] px-4 py-3">
              <p className="text-xs leading-relaxed text-sky-100/80">{PRIVACY_NOTICE}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                {analysis.reading}
              </p>
            </div>

            {!feedbackDone ? (
              <div className="rounded-xl border border-white/10 p-4">
                <p className="text-sm text-white/70">Bu analiz isabetli mi?</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleFeedback(true)}
                    className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100 hover:bg-emerald-400/15"
                  >
                    Evet
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleFeedback(false)}
                    className="flex-1 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2.5 text-sm text-red-100 hover:bg-red-400/15"
                  >
                    Hayır
                  </button>
                </div>
              </div>
            ) : null}

            {canSave && !savedToJournal ? (
              <button
                type="button"
                onClick={() => void handleSaveToJournal()}
                className="w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 hover:bg-amber-400/15"
              >
                Kozmik Günlüğüme Kaydet
              </button>
            ) : null}

            {savedToJournal ? (
              <p className="text-center text-sm text-emerald-200/85">
                Analiz Kozmik Günlüğünüze şifreli olarak kaydedildi.
              </p>
            ) : null}

            {refundMessage ? (
              <p className="text-center text-sm text-amber-200/85">{refundMessage}</p>
            ) : null}

            {feedbackDone && canSave ? (
              <button
                type="button"
                onClick={() => {
                  setAnalysis(null);
                  setFeedbackDone(false);
                  setCanSave(false);
                }}
                className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:text-white"
              >
                Yeni Analiz
              </button>
            ) : null}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
