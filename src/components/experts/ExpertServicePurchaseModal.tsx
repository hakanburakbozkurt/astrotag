"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  confirmExpertServicePurchaseAction,
  getServicePurchasePreviewAction,
} from "@/lib/actions/expert-marketplace";
import type { ServicePurchasePreview } from "@/lib/experts/service-marketplace.shared";
import { formatCrystalPriceLabel } from "@/lib/payments/commission.shared";

type ExpertServicePurchaseModalProps = {
  open: boolean;
  expertProfileId: string | null;
  serviceId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

function ContextField({ label, value }: { label: string; value: string }) {
  if (!value.trim()) {
    return null;
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-300">{value}</p>
    </div>
  );
}

export default function ExpertServicePurchaseModal({
  open,
  expertProfileId,
  serviceId,
  onClose,
  onSuccess,
}: ExpertServicePurchaseModalProps) {
  const [preview, setPreview] = useState<ServicePurchasePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientNote, setClientNote] = useState("");

  useEffect(() => {
    if (!open || !expertProfileId || !serviceId) {
      setPreview(null);
      setError(null);
      setClientNote("");
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      const result = await getServicePurchasePreviewAction(
        expertProfileId,
        serviceId
      );
      setLoading(false);

      if (!result.ok) {
        setError(result.error);
        setPreview(null);
        return;
      }

      setPreview(result.preview);
    })();
  }, [open, expertProfileId, serviceId]);

  const handleConfirm = async () => {
    if (!expertProfileId || !serviceId) {
      return;
    }

    setConfirming(true);
    setError(null);

    const result = await confirmExpertServicePurchaseAction({
      expertProfileId,
      serviceId,
      clientNote,
    });

    setConfirming(false);

    if (!result.ok) {
      setError(result.error ?? "İşlem başarısız.");
      return;
    }

    onSuccess();
    onClose();
  };

  const insufficientBalance =
    preview !== null && preview.crystalBalance < preview.service.crystalPrice;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm border border-zinc-800 bg-[#09090b] p-5"
          >
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">
              Hizmet Onayı
            </p>
            <h2 className="mt-2 font-serif text-xl text-zinc-100">
              {preview?.service.name ?? "Yükleniyor…"}
            </h2>
            {preview ? (
              <p className="mt-1 text-sm text-zinc-500">
                {preview.expertDisplayName} · {preview.service.durationMinutes} dk
              </p>
            ) : null}

            {loading ? (
              <p className="mt-6 text-sm text-zinc-500">Önizleme hazırlanıyor…</p>
            ) : preview ? (
              <div className="mt-5 space-y-5">
                {preview.service.imageUrl ? (
                  <div className="overflow-hidden rounded-sm border border-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.service.imageUrl}
                      alt=""
                      className="aspect-[16/10] w-full object-cover"
                    />
                  </div>
                ) : null}
                {preview.service.description ? (
                  <section>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                      Kapsam
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {preview.service.description}
                    </p>
                  </section>
                ) : null}

                <section className="rounded-sm border border-zinc-800 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Profilinizden otomatik
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ContextField label="Ad" value={preview.profileContext.name} />
                    <ContextField
                      label="Doğum tarihi"
                      value={preview.profileContext.birthDate}
                    />
                    <ContextField
                      label="Doğum saati"
                      value={preview.profileContext.birthTime}
                    />
                    <ContextField
                      label="Doğum yeri"
                      value={preview.profileContext.birthPlace}
                    />
                    <ContextField
                      label="İlişki durumu"
                      value={preview.profileContext.relationshipStatus}
                    />
                    {preview.profileContext.partnerName ? (
                      <>
                        <ContextField
                          label="Partner"
                          value={preview.profileContext.partnerName}
                        />
                        <ContextField
                          label="Partner doğum"
                          value={
                            preview.profileContext.partnerBirthDate
                              ? `${preview.profileContext.partnerBirthDate}${preview.profileContext.partnerBirthTime ? ` · ${preview.profileContext.partnerBirthTime}` : ""}`
                              : ""
                          }
                        />
                        <ContextField
                          label="Partner doğum yeri"
                          value={preview.profileContext.partnerBirthPlace ?? ""}
                        />
                      </>
                    ) : null}
                  </div>
                  <p className="mt-3 text-xs text-zinc-600">
                    Bu bilgiler profilinizden alınır; tekrar girmeniz gerekmez.
                  </p>
                </section>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Notunuz (isteğe bağlı)
                  </span>
                  <textarea
                    rows={2}
                    value={clientNote}
                    onChange={(e) => setClientNote(e.target.value)}
                    className="mt-2 w-full rounded-sm border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300 outline-none focus:border-zinc-600"
                    placeholder="Uzmana iletmek istediğiniz soru veya odak…"
                  />
                </label>

                <section className="rounded-sm border border-zinc-800 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Kristal dağılımı
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between text-zinc-300">
                      <dt>Toplam</dt>
                      <dd className="font-mono">
                        {formatCrystalPriceLabel(preview.commission.totalCrystals)}
                      </dd>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <dt>Platform komisyonu (%20)</dt>
                      <dd className="font-mono">
                        ₺{preview.commission.platformCommissionTry.toLocaleString("tr-TR")}
                      </dd>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <dt>Uzman hakedişi (%80)</dt>
                      <dd className="font-mono">
                        ₺{preview.commission.expertPayoutTry.toLocaleString("tr-TR")}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-zinc-800 pt-2 text-zinc-500">
                      <dt>Cüzdan bakiyeniz</dt>
                      <dd className="font-mono">{preview.crystalBalance} kristal</dd>
                    </div>
                  </dl>
                </section>

                {insufficientBalance ? (
                  <p className="text-xs text-zinc-400">
                    Yetersiz kristal bakiyesi. Devam etmek için kristal yükleyin.
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? <p className="mt-4 text-xs text-zinc-400">{error}</p> : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={confirming || loading || !preview || insufficientBalance}
                onClick={() => void handleConfirm()}
                className="flex-1 rounded-sm border border-zinc-700 bg-zinc-900 py-2.5 text-xs uppercase tracking-widest text-zinc-200 disabled:opacity-50"
              >
                {confirming ? "İşleniyor…" : "Onayla ve Öde"}
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={onClose}
                className="flex-1 rounded-sm border border-zinc-800 py-2.5 text-xs uppercase tracking-widest text-zinc-500"
              >
                Vazgeç
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
