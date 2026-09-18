"use client";

import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ManifestoTechniqueGuide from "@/components/home/manifesto/ManifestoTechniqueGuide";
import type { OrbitStep } from "@/components/home/manifesto/manifesto-portal-orbit";
import type { ManifestoTechniqueId } from "@/lib/manifesto/types";

interface ManifestoIntentFormProps {
  intention: string;
  techniqueType: ManifestoTechniqueId;
  previewTechniqueId: ManifestoTechniqueId | null;
  orbitStep: OrbitStep;
  ritualActive: boolean;
  hidden: boolean;
  onIntentionChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => void;
}

const textareaClass =
  "mt-2 min-h-[96px] w-full resize-y rounded-sm border border-zinc-800 bg-black px-3 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/25 focus:border-zinc-600";

export default function ManifestoIntentForm({
  intention,
  techniqueType,
  previewTechniqueId,
  orbitStep,
  ritualActive,
  hidden,
  onIntentionChange,
  onSubmit,
}: ManifestoIntentFormProps) {
  const guideTechniqueId = previewTechniqueId ?? techniqueType;

  return (
    <section
      className={`rounded-sm border border-zinc-800 bg-zinc-950 p-5 transition-opacity duration-300 sm:p-6 ${
        hidden ? "pointer-events-none invisible opacity-0" : ""
      }`}
      aria-hidden={hidden}
      aria-label="Niyet formu"
    >
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-6">
        <div>
          <label htmlFor="manifesto-intention" className="text-sm text-stone-400">
            Niyetin
          </label>
          <textarea
            id="manifesto-intention"
            value={intention}
            onChange={(event) => onIntentionChange(event.target.value)}
            placeholder="Finansal özgürlüğümü güvenle inşa ediyorum…"
            className={textareaClass}
            maxLength={280}
            disabled={ritualActive}
          />
        </div>

        <AnimatePresence mode="wait">
          {orbitStep === "technique" ? (
            <motion.div
              key={guideTechniqueId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-sm text-stone-400">Teknik rehberi</p>
              <div className="mt-2">
                <ManifestoTechniqueGuide techniqueId={guideTechniqueId} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={ritualActive}
          whileTap={{ scale: ritualActive ? 1 : 0.98 }}
          className="w-full rounded-sm border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-sm font-medium text-stone-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ritualActive ? "Kozmik manifesto yazılıyor…" : "Bugünkü Manifestimi Al"}
        </motion.button>
      </form>
    </section>
  );
}
