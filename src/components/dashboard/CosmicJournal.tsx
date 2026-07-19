"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getCosmicJournalReadings,
} from "@/lib/actions/cosmic-journal";
import type {
  CosmicJournalFilter,
  CosmicReadingRecord,
} from "@/lib/cosmic-journal/types";
import { getArchiveReadingPreview } from "@/lib/analysis/archive-presentation";
import ReadingDetailView from "@/components/dashboard/ReadingDetailView";
import ReadingTypeBadge from "@/components/dashboard/ReadingTypeBadge";

const FILTERS: Array<{ id: CosmicJournalFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "Tarot", label: "Tarot" },
  { id: "Synastry", label: "Synastry" },
  { id: "Horary", label: "Horary" },
  { id: "CosmicProfile", label: "Kozmik Profil" },
];

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function excerpt(text: string, max = 88): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max).trim()}…`;
}

function readingPreview(reading: CosmicReadingRecord): string {
  const summary = getArchiveReadingPreview(reading.reading_result, 96);

  if (reading.type === "Synastry" && reading.synastry) {
    return `${reading.synastry.partner_name} · Skor ${reading.synastry.compatibility_score} — ${summary}`;
  }

  if (reading.type === "CosmicProfile" && reading.cosmicProfile) {
    return `${reading.cosmicProfile.subject_name} · ${reading.cosmicProfile.tier_label} — ${summary}`;
  }

  return summary;
}

export default function CosmicJournal() {
  const [filter, setFilter] = useState<CosmicJournalFilter>("all");
  const [readings, setReadings] = useState<CosmicReadingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<CosmicReadingRecord | null>(null);

  const loadReadings = useCallback(async (nextFilter: CosmicJournalFilter) => {
    setIsLoading(true);
    try {
      const rows = await getCosmicJournalReadings(nextFilter);
      setReadings(rows);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReadings(filter);
  }, [filter, loadReadings]);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
              Kozmik Günlüğüm
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/40">
              Tarot, Synastry ve Horary okuma arşivi
            </p>
          </div>

          <div className="w-full shrink-0 overflow-x-auto overscroll-x-contain sm:w-auto">
            <div className="flex min-w-max gap-1 rounded-lg border border-white/[0.08] bg-black/20 p-0.5">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`min-h-9 rounded-md px-3 font-mono text-[10px] uppercase tracking-wider transition ${
                    filter === item.id
                      ? "bg-amber-400/15 text-amber-100"
                      : "text-white/40 hover:text-white/65"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-white/[0.06] bg-[#0a0f1a]/50 sm:max-h-64">
          {isLoading ? (
            <p className="px-4 py-8 text-center font-mono text-xs text-white/35">
              Günlük yükleniyor…
            </p>
          ) : readings.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm leading-relaxed text-white/40">
              Henüz kayıtlı okuma yok. Tarot veya Synastry analizi yaptığında
              burada görünecek.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {readings.map((reading) => (
                <li key={reading.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(reading)}
                    className="flex w-full flex-col gap-2 px-3 py-3 text-left transition hover:bg-white/[0.04] sm:px-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <ReadingTypeBadge type={reading.type} compact />
                      <span className="shrink-0 font-mono text-[10px] text-white/30">
                        {formatShortDate(reading.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-snug text-white/80">
                      {excerpt(reading.question, 72)}
                    </p>
                    <p className="text-xs leading-relaxed text-white/45">
                      {readingPreview(reading)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.section>

      <ReadingDetailView
        reading={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
