"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CosmicReadingRecord } from "@/lib/cosmic-journal/types";
import ReadingTypeBadge from "@/components/dashboard/ReadingTypeBadge";

type ReadingDetailViewProps = {
  reading: CosmicReadingRecord | null;
  onClose: () => void;
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ReadingDetailView({
  reading,
  onClose,
}: ReadingDetailViewProps) {
  return (
    <AnimatePresence>
      {reading ? (
        <>
          <motion.button
            type="button"
            aria-label="Kapat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] cursor-default bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reading-detail-title"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-[90] flex max-h-[min(88dvh,640px)] w-[calc(100%-1.25rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1a]/96 shadow-[0_28px_56px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl sm:w-[calc(100%-1.5rem)] sm:rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 border-b border-white/[0.08] px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReadingTypeBadge type={reading.type} />
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                      Kozmik Günlük
                    </p>
                  </div>
                  <h2
                    id="reading-detail-title"
                    className="mt-2 text-base font-medium text-white/90"
                  >
                    Okuma Detayı
                  </h2>
                  <p className="mt-1 font-mono text-[10px] text-white/35">
                    {formatDate(reading.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/50 transition hover:border-amber-400/25 hover:text-amber-100"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Soru
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {reading.question}
              </p>

              {reading.type === "Tarot" &&
              reading.cards &&
              reading.cards.length > 0 ? (
                <div className="mt-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Kartlar
                  </p>
                  <ul className="mt-2 space-y-2">
                    {reading.cards.map((card) => (
                      <li
                        key={`${card.id}-${card.position ?? "card"}`}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 font-mono text-xs text-white/65"
                      >
                        <span className="text-amber-400/70">
                          {card.position ?? "—"}
                        </span>
                        {" · "}
                        {card.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {reading.type === "Synastry" && reading.synastry ? (
                <div className="mt-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Synastry Özeti
                  </p>
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center self-start rounded-full border border-emerald-400/30 bg-emerald-400/10 sm:self-center">
                      <span className="text-xl font-bold text-emerald-100">
                        {reading.synastry.compatibility_score}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                        Partner
                      </p>
                      <p className="mt-1 text-sm text-white/85">
                        {reading.synastry.partner_name}
                      </p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400/60">
                        Uyum Skoru
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {reading.type === "Synastry"
                    ? "Synastry Yorumu"
                    : "Medyum Yorumu"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-[1.75] text-white/75">
                  {reading.reading_result}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
