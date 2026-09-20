"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import ExpertsDirectory from "@/components/experts/ExpertsDirectory";
import ExpertProfileVitrineHeader from "@/components/experts/ExpertProfileVitrineHeader";
import ExpertServiceCard from "@/components/experts/ExpertServiceCard";
import ExpertServicePurchaseModal from "@/components/experts/ExpertServicePurchaseModal";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import DataLoadingState from "@/components/ui/DataLoadingState";
import { getExpertPublicProfileAction } from "@/lib/actions/wallet";
import type { ExpertPublicProfile } from "@/lib/experts/experts.server";

function ExpertDetailView({
  expert,
  onSelectService,
  purchaseSuccess,
}: {
  expert: ExpertPublicProfile;
  onSelectService: (serviceId: string) => void;
  purchaseSuccess: string | null;
}) {
  return (
    <motion.div
      key={expert.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <ExpertProfileVitrineHeader expert={expert} />

      {(expert.aboutText || expert.philosophyText || expert.experienceText) && (
        <section className="rounded-sm border border-zinc-800 bg-[#09090b] p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-600">
            Hakkımda
          </p>
          {expert.aboutText ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
              {expert.aboutText}
            </p>
          ) : null}
          {expert.experienceText ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-500">
              {expert.experienceText}
            </p>
          ) : null}
          {expert.philosophyText ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-500">
              {expert.philosophyText}
            </p>
          ) : null}
        </section>
      )}

      <section>
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-600">
          Hizmet Kartları
        </p>
        <div className="mt-4 space-y-3">
          {expert.services.length === 0 ? (
            <p className="text-sm text-zinc-500">Henüz hizmet tanımlanmamış.</p>
          ) : (
            expert.services.map((service) => (
              <ExpertServiceCard
                key={service.id}
                service={service}
                onPurchase={() => onSelectService(service.id)}
              />
            ))
          )}
        </div>
        {purchaseSuccess ? (
          <p className="mt-3 text-xs text-zinc-400">{purchaseSuccess}</p>
        ) : null}
      </section>

      <section className="rounded-sm border border-zinc-800 bg-[#09090b] p-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-600">
          Yazılar
        </p>
        <ul className="mt-4 space-y-3">
          {expert.articles.length === 0 ? (
            <li className="text-sm text-zinc-500">Henüz yayınlanmış yazı yok.</li>
          ) : (
            expert.articles.map((article) => (
              <li
                key={article.id}
                className="rounded-sm border border-zinc-800 p-4"
              >
                <p className="font-serif text-sm text-zinc-200">{article.title}</p>
                {article.excerpt ? (
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExpertPublicProfile | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const loadDetail = useCallback(async (expertId: string) => {
    setLoadingDetail(true);
    setPurchaseSuccess(null);
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

  const openPurchaseModal = (serviceId: string) => {
    setPendingServiceId(serviceId);
    setPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setPurchaseModalOpen(false);
    setPendingServiceId(null);
  };

  const handlePurchaseSuccess = () => {
    setPurchaseSuccess("Hizmet talebiniz alındı. Kristaller cüzdanınızdan düşüldü.");
  };

  return (
    <TabPageScaffold
      embedded
      eyebrow="Uzmanlar"
      title="Kozmik Uzmanlar"
      description="Gerçek uzman seansları — kristal ile rezervasyon."
    >
      <ExpertsDirectory
        selectedId={selectedId}
        onSelectExpert={setSelectedId}
      />

      {loadingDetail ? (
        <DataLoadingState className="mt-2" compact />
      ) : detail ? (
        <ExpertDetailView
          expert={detail}
          onSelectService={openPurchaseModal}
          purchaseSuccess={purchaseSuccess}
        />
      ) : null}

      <ExpertServicePurchaseModal
        open={purchaseModalOpen}
        expertProfileId={detail?.id ?? null}
        serviceId={pendingServiceId}
        onClose={closePurchaseModal}
        onSuccess={handlePurchaseSuccess}
      />
    </TabPageScaffold>
  );
}
