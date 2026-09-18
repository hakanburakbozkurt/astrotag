"use client";

import { useCallback, useEffect, useState } from "react";
import { History } from "lucide-react";
import { listManifestoHistoryAction } from "@/lib/actions/manifesto";
import { useUserProfile } from "@/lib/auth";
import type { ManifestoHistoryItem } from "@/lib/manifesto/types";
import DailyCosmicModal from "@/components/home/DailyCosmicModal";
import DataLoadingState from "@/components/ui/DataLoadingState";

export default function ManifestoHistorySection() {
  const { userData } = useUserProfile();
  const [items, setItems] = useState<ManifestoHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ManifestoHistoryItem | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const history = await listManifestoHistoryAction();
      setItems(history);
      setLoading(false);
    })();
  }, []);

  const closeModal = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <section className="rounded-sm border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-stone-300" aria-hidden />
        <p className="text-[10px] uppercase tracking-[0.28em] text-stone-300">
          Manifesto Geçmişi
        </p>
      </div>

      {loading ? (
        <DataLoadingState className="mt-4" compact />
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-white/45">
          Henüz kayıtlı manifesto yok. Dashboard&apos;daki manifesto motorundan başlayın.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-zinc-700 hover:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-white/85">
                    {item.categoryLabel}
                  </span>
                  <span className="font-mono text-[10px] text-white/35">
                    {item.lastCheckedDate ?? "—"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-white/45">
                  {item.presentation?.manifestoClaim ?? item.lastMessage ?? "—"}
                </p>
                <p className="mt-1 text-[10px] text-stone-300">
                  Gün {item.currentDay}/{item.maxDays} · {item.techniqueLabel}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <DailyCosmicModal
        open={selected !== null}
        manifesto={selected}
        userName={userData?.name ?? ""}
        onAccept={closeModal}
        onClose={closeModal}
        readOnly
      />
    </section>
  );
}
