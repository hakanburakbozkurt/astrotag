"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import DataLoadingState from "@/components/ui/DataLoadingState";
import {
  getExpertPublicProfileAction,
  listPublishedExpertsAction,
  purchaseExpertServiceAction,
} from "@/lib/actions/wallet";
import type { ExpertPublicProfile } from "@/lib/experts/experts.server";

type ExpertCard = Awaited<ReturnType<typeof listPublishedExpertsAction>>[number];

function ExpertVitrineCard({
  expert,
  selected,
  onSelect,
}: {
  expert: ExpertCard;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-[140px] shrink-0 flex-col items-center rounded-2xl border px-3 py-4 text-center transition ${
        selected
          ? "border-amber-400/40 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20"
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-2xl">
        {expert.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={expert.avatarUrl}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          "✨"
        )}
      </div>
      <p className="mt-3 line-clamp-2 text-xs font-semibold text-white/90">
        {expert.displayName}
      </p>
      <p className="mt-1 line-clamp-1 text-[10px] text-amber-200/70">
        {expert.tradition}
      </p>
    </button>
  );
}

function ExpertDetailView({
  expert,
  onBook,
  bookingError,
  bookingBusy,
}: {
  expert: ExpertPublicProfile;
  onBook: (serviceId: string) => void;
  bookingError: string | null;
  bookingBusy: string | null;
}) {
  return (
    <motion.div
      key={expert.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <header className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
          {expert.tradition}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white/95">
          {expert.displayName}
        </h2>
        <p className="mt-1 text-sm text-amber-200/80">{expert.title}</p>
        <p className="mt-2 text-xs text-white/45">
          {expert.experienceYears}+ yıl deneyim
        </p>
      </header>

      <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">
          Hizmet Menüsü
        </p>
        <ul className="mt-4 space-y-3">
          {expert.services.length === 0 ? (
            <li className="text-sm text-white/45">Henüz hizmet tanımlanmamış.</li>
          ) : (
            expert.services.map((service) => (
              <li
                key={service.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white/90">
                      {service.name}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white/45">
                      {service.description}
                    </p>
                    <p className="mt-2 text-[10px] text-white/35">
                      {service.durationMinutes} dk
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-violet-200">
                      {service.crystalPrice} 🔮
                    </p>
                    <button
                      type="button"
                      disabled={bookingBusy !== null}
                      onClick={() => onBook(service.id)}
                      className="mt-2 rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-[10px] uppercase tracking-wider text-violet-100 disabled:opacity-50"
                    >
                      {bookingBusy === service.id ? "…" : "Rezerve Et"}
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
        {bookingError ? (
          <p className="mt-3 text-xs text-red-300/85">{bookingError}</p>
        ) : null}
      </section>

      {(expert.aboutText || expert.philosophyText) && (
        <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">
            Hakkımda / Felsefe
          </p>
          {expert.aboutText ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
              {expert.aboutText}
            </p>
          ) : null}
          {expert.philosophyText ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/55">
              {expert.philosophyText}
            </p>
          ) : null}
        </section>
      )}

      <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">
          Yazılar
        </p>
        <ul className="mt-4 space-y-3">
          {expert.articles.length === 0 ? (
            <li className="text-sm text-white/45">Henüz yayınlanmış yazı yok.</li>
          ) : (
            expert.articles.map((article) => (
              <li
                key={article.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <p className="text-sm font-medium text-white/88">{article.title}</p>
                {article.excerpt ? (
                  <p className="mt-2 text-xs leading-relaxed text-white/45">
                    {article.excerpt}
                  </p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </motion.div>
  );
}

export default function ExpertsTabContent() {
  const [experts, setExperts] = useState<ExpertCard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExpertPublicProfile | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [bookingBusy, setBookingBusy] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoadingList(true);
      const rows = await listPublishedExpertsAction();
      setExperts(rows);
      if (rows[0]) {
        setSelectedId(rows[0].id);
      }
      setLoadingList(false);
    })();
  }, []);

  const loadDetail = useCallback(async (expertId: string) => {
    setLoadingDetail(true);
    setBookingError(null);
    const profile = await getExpertPublicProfileAction(expertId);
    setDetail(profile);
    setLoadingDetail(false);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const handleBook = async (serviceId: string) => {
    if (!detail) {
      return;
    }

    setBookingBusy(serviceId);
    setBookingError(null);

    const result = await purchaseExpertServiceAction(detail.id, serviceId);

    if (!result.ok) {
      setBookingError(result.error ?? "Rezervasyon başarısız.");
    } else {
      setBookingError(null);
    }

    setBookingBusy(null);
  };

  return (
    <TabPageScaffold
      eyebrow="Uzmanlar"
      title="Kozmik Uzmanlar"
      description="Gerçek uzman seansları — kristal ile rezervasyon."
    >
      {loadingList ? (
        <DataLoadingState className="mt-6" />
      ) : experts.length === 0 ? (
        <p className="mt-6 text-sm text-white/45">
          Henüz yayında uzman profili yok. Uzmanlar panelden profillerini
          yayınlayabilir.
        </p>
      ) : (
        <>
          <div className="-mx-1 mt-4 overflow-x-auto pb-2">
            <div className="flex gap-3 px-1">
              {experts.map((expert) => (
                <ExpertVitrineCard
                  key={expert.id}
                  expert={expert}
                  selected={selectedId === expert.id}
                  onSelect={() => setSelectedId(expert.id)}
                />
              ))}
            </div>
          </div>

          {loadingDetail ? (
            <DataLoadingState className="mt-6" compact />
          ) : detail ? (
            <ExpertDetailView
              expert={detail}
              onBook={(serviceId) => void handleBook(serviceId)}
              bookingError={bookingError}
              bookingBusy={bookingBusy}
            />
          ) : null}
        </>
      )}
    </TabPageScaffold>
  );
}
