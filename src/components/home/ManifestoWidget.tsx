"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { generateDailyManifestoAction, loadManifestoStateAction } from "@/lib/actions/manifesto";
import ManifestoTechniquePicker from "@/components/home/ManifestoTechniquePicker";
import ManifestoStoryShare from "@/components/home/ManifestoStoryShare";
import {
  MANIFESTO_CATEGORIES,
  MANIFESTO_TECHNIQUES,
  type ManifestoCategoryId,
  type ManifestoTechniqueId,
  type UserManifestoRecord,
} from "@/lib/manifesto/types";
import type { UserData } from "@/types/user";

interface ManifestoWidgetProps {
  user: UserData;
}

const selectClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-400/35";

const textareaClass =
  "mt-1.5 min-h-[88px] w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/35";

const LAYER_ACCENT = {
  violet: "border-violet-400/30 text-violet-200/80",
  amber: "border-amber-400/30 text-amber-200/80",
  emerald: "border-emerald-400/35 text-emerald-200/85",
  rose: "border-rose-400/25 text-rose-200/75",
} as const;

function ManifestoLayer({
  label,
  text,
  accent,
  highlight = false,
}: {
  label: string;
  text: string;
  accent: keyof typeof LAYER_ACCENT;
  highlight?: boolean;
}) {
  if (!text.trim()) {
    return null;
  }

  return (
    <article
      className={`rounded-xl border bg-white/[0.02] p-3.5 ${LAYER_ACCENT[accent]} ${
        highlight ? "border-emerald-400/40 bg-emerald-500/[0.06]" : "border-white/10"
      }`}
    >
      <p className="text-[9px] uppercase tracking-[0.22em] opacity-80">{label}</p>
      <p
        className={`mt-2 leading-relaxed ${
          highlight
            ? "text-base font-semibold italic text-emerald-50/95"
            : "text-sm text-white/82"
        }`}
      >
        {text}
      </p>
    </article>
  );
}

export default function ManifestoWidget({ user }: ManifestoWidgetProps) {
  const [category, setCategory] = useState<ManifestoCategoryId>("para");
  const [techniqueType, setTechniqueType] =
    useState<ManifestoTechniqueId>("21_days");
  const [intention, setIntention] = useState("");
  const [manifesto, setManifesto] = useState<UserManifestoRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      setLoading(true);
      setError(null);

      const result = await generateDailyManifestoAction(user, {
        category,
        techniqueType,
        intention,
      });

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setManifesto(result.manifesto);
      setLoading(false);
    },
    [user, category, techniqueType, intention]
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const state = await loadManifestoStateAction({ category, techniqueType });
      if (!cancelled && state) {
        setManifesto(state);
        if (state.intention) {
          setIntention(state.intention);
        }
      } else if (!cancelled) {
        setManifesto(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [category, techniqueType]);

  const progress =
    manifesto && manifesto.maxDays > 0
      ? Math.min(100, (manifesto.currentDay / manifesto.maxDays) * 100)
      : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
      className="mb-6 w-full rounded-[28px] border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.08] via-[#0f172a]/90 to-amber-500/[0.05] p-4 backdrop-blur-xl sm:mb-8 sm:p-5"
      id="manifesto-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-violet-300/70">
            Manifesto Motoru
          </p>
          <h2 className="mt-1 text-base font-semibold text-white/95">
            Günlük Kozmik Niyetin
          </h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10 text-violet-200">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
        <div>
          <label htmlFor="manifesto-category" className="text-[11px] text-white/45">
            Kategori
          </label>
          <select
            id="manifesto-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ManifestoCategoryId)
            }
            className={selectClass}
          >
            {MANIFESTO_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id} className="bg-[#0f172a]">
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-[11px] text-white/45">Teknik</p>
          <ManifestoTechniquePicker
            value={techniqueType}
            onChange={setTechniqueType}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="manifesto-intention" className="text-[11px] text-white/45">
            Niyetin
          </label>
          <textarea
            id="manifesto-intention"
            value={intention}
            onChange={(event) => setIntention(event.target.value)}
            placeholder="Örn: Finansal özgürlüğümü güvenle inşa ediyorum..."
            className={textareaClass}
            maxLength={280}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-3 text-sm font-medium text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-50"
        >
          {loading ? "Kozmik manifesto yazılıyor…" : "Bugünkü Manifestimi Al"}
        </button>
      </form>

      {manifesto ? (
        <div className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-white/45">
              <span>
                Gün {manifesto.currentDay} / {manifesto.maxDays}
              </span>
              {manifesto.generatedToday ? (
                <span className="text-emerald-300/80">Bugün alındı</span>
              ) : null}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-amber-300 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {manifesto.presentation ? (
            <div className="space-y-4">
              <ManifestoLayer
                label="Gökyüzü Kapısı"
                text={manifesto.presentation.cosmicHook}
                accent="violet"
              />
              <ManifestoLayer
                label="Harita Aynası"
                text={manifesto.presentation.natalMirror}
                accent="amber"
              />
              <ManifestoLayer
                label="Manifesto"
                text={manifesto.presentation.manifestoClaim}
                accent="emerald"
                highlight
              />
              <ManifestoLayer
                label="Ritüel Fısıltısı"
                text={manifesto.presentation.ritualWhisper}
                accent="rose"
              />
            </div>
          ) : manifesto.lastMessage ? (
            <blockquote className="border-l-2 border-amber-400/50 pl-4 text-sm italic leading-relaxed text-amber-50/90">
              “{manifesto.lastMessage}”
            </blockquote>
          ) : null}

          {manifesto.isComplete ? (
            <p className="text-[11px] text-amber-200/70">
              Döngü tamamlandı. Yarın yeni bir seriye başlayabilirsin.
            </p>
          ) : null}

          {manifesto.presentation ? (
            <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="mb-3 text-center text-[10px] uppercase tracking-[0.22em] text-white/35">
                Story Video · 9:16
              </p>
              <ManifestoStoryShare
                presentation={manifesto.presentation}
                userName={user.name ?? undefined}
                categoryLabel={
                  MANIFESTO_CATEGORIES.find((c) => c.id === manifesto.category)?.label
                }
                cycleLabel={`Gün ${manifesto.currentDay} / ${manifesto.maxDays} · ${
                  MANIFESTO_TECHNIQUES.find((t) => t.id === manifesto.techniqueType)?.label ??
                  manifesto.techniqueType
                }`}
              />
            </section>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs text-red-300/85" role="alert">
          {error}
        </p>
      ) : null}
    </motion.section>
  );
}
