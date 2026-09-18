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
import { compactSectionClass } from "@/components/navigation/compact-ui";

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
        className={`mt-8 w-full min-w-0 ${compactSectionClass} p-4 sm:p-5`}
      >
        <div className="w-full min-w-0 space-y-3">
          <div className="w-full min-w-0">
            <p className="text-sm font-medium text-stone-300">Kozmik Günlüğüm</p>
            <p className="mt-0.5 text-xs text-stone-500">Okuma Arşivi</p>
          </div>

          <div className="flex w-full min-w-0 flex-wrap gap-2 rounded-sm border border-zinc-800 bg-zinc-950 p-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-sm px-3 py-2 text-[10px] uppercase tracking-wider transition ${
                  filter === item.id
                    ? "bg-zinc-800 text-stone-300"
                    : "text-stone-500 hover:text-stone-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto overscroll-contain rounded-sm border border-zinc-800 bg-zinc-950 sm:max-h-64">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-xs text-stone-500">
              Günlük yükleniyor…
            </p>
          ) : readings.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm leading-relaxed text-stone-500">
              Henüz kayıtlı okuma yok. Tarot veya Synastry analizi yaptığında
              burada görünecek.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {readings.map((reading) => (
                <li key={reading.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(reading)}
                    className="flex w-full flex-col gap-2 px-3 py-3 text-left transition hover:bg-zinc-900 sm:px-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <ReadingTypeBadge type={reading.type} compact />
                      <span className="shrink-0 text-[10px] text-stone-500">
                        {formatShortDate(reading.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-snug text-stone-300">
                      {excerpt(reading.question, 72)}
                    </p>
                    <p className="text-xs leading-relaxed text-stone-500">
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
