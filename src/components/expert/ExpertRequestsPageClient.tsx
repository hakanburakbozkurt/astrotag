"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import {
  listExpertIncomingRequestsAction,
  type ExpertIncomingRequest,
} from "@/lib/actions/expert-requests";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ExpertRequestsPageClient() {
  const [requests, setRequests] = useState<ExpertIncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await listExpertIncomingRequestsAction();
    if (!result.ok) {
      setError(result.error);
      setRequests([]);
    } else {
      setRequests(result.requests);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <TabPageScaffold
      eyebrow="Uzman"
      title="Danışmanlık Talepleri"
      description="Kristal ile ödenen seans talepleri. Müşterilerinize zamanında yanıt verin."
    >
      <div className="mb-4">
        <Link
          href="/dashboard/profile"
          className="text-xs uppercase tracking-wider text-stone-300 underline decoration-emerald-400/30 underline-offset-2"
        >
          ← Profile dön
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-white/45">Talepler yükleniyor…</p>
      ) : null}

      {error ? <p className="text-sm text-stone-400">{error}</p> : null}

      {!loading && !error && requests.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
          Henüz ödenmiş danışmanlık talebi yok.
        </p>
      ) : null}

      <ul className="space-y-3">
        {requests.map((request) => (
          <li
            key={request.id}
            className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/90">
                  {request.serviceName ?? "Uzman seansı"}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  {formatDate(request.createdAt)}
                </p>
                <p className="mt-2 text-xs text-stone-300">
                  {request.crystalsSpent} 🔮 kristal · Hakediş ₺
                  {request.expertPayoutTry.toLocaleString("tr-TR")}
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/45">
                {request.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </TabPageScaffold>
  );
}
