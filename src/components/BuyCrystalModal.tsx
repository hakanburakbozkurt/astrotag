"use client";

import { useEffect, useMemo, useState } from "react";
import LegalConsentRow from "@/components/legal/LegalConsentRow";
import LegalDocumentModal from "@/components/legal/LegalDocumentModal";
import { initCustomCrystalCheckoutAction } from "@/lib/actions/wallet";
import { LEGAL_VERSION } from "@/lib/legal/consent-config";
import type { LegalDocumentSlug } from "@/lib/legal/legal-document-slugs";
import {
  DEFAULT_CRYSTAL_UNIT_TRY,
  MIN_CRYSTAL_PURCHASE,
  quoteCrystalPurchaseTry,
  validateCrystalPurchaseAmount,
} from "@/lib/payments/crystal-purchase.shared";

type BuyCrystalModalProps = {
  open: boolean;
  onClose: () => void;
};

const fieldClass =
  "w-full rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600";

export default function BuyCrystalModal({ open, onClose }: BuyCrystalModalProps) {
  const [amountInput, setAmountInput] = useState(String(MIN_CRYSTAL_PURCHASE));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedDistanceSelling, setAcceptedDistanceSelling] = useState(false);
  const [acceptedCayma, setAcceptedCayma] = useState(false);
  const [acceptedInstantFulfillment, setAcceptedInstantFulfillment] = useState(false);
  const [legalDocSlug, setLegalDocSlug] = useState<LegalDocumentSlug | null>(null);

  const checkoutConsentsReady =
    acceptedDistanceSelling && acceptedCayma && acceptedInstantFulfillment;

  const parsedAmount = useMemo(() => {
    const value = Number.parseInt(amountInput.trim(), 10);
    return Number.isFinite(value) ? value : NaN;
  }, [amountInput]);

  const validationError = useMemo(() => {
    if (amountInput.trim() === "") {
      return "Kristal adedi girin.";
    }
    return validateCrystalPurchaseAmount(parsedAmount);
  }, [amountInput, parsedAmount]);

  const totalTry = useMemo(() => {
    if (validationError) {
      return null;
    }
    return quoteCrystalPurchaseTry(parsedAmount);
  }, [parsedAmount, validationError]);

  useEffect(() => {
    if (!open) {
      setAmountInput(String(MIN_CRYSTAL_PURCHASE));
      setError(null);
      setSubmitting(false);
      setAcceptedDistanceSelling(false);
      setAcceptedCayma(false);
      setAcceptedInstantFulfillment(false);
      setLegalDocSlug(null);
    }
  }, [open]);

  const handlePurchase = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!checkoutConsentsReady) {
      setError("Devam etmek için mesafeli satış ve dijital ifa onaylarını kabul edin.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await initCustomCrystalCheckoutAction(parsedAmount, [
        {
          consentType: "distance_selling",
          version: LEGAL_VERSION,
          isAccepted: acceptedDistanceSelling,
        },
        {
          consentType: "cayma_hakki",
          version: LEGAL_VERSION,
          isAccepted: acceptedCayma,
        },
        {
          consentType: "instant_digital_fulfillment",
          version: LEGAL_VERSION,
          isAccepted: acceptedInstantFulfillment,
        },
      ]);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      window.location.href = result.checkoutUrl;
    } catch {
      setError("Ödeme başlatılamadı.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <LegalDocumentModal
        slug={legalDocSlug}
        onClose={() => setLegalDocSlug(null)}
      />
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-label="Kristal satın al"
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-sm rounded-sm border border-zinc-800 bg-[#09090b] p-4 shadow-[0_0_24px_rgba(239,68,68,0.06)]"
        >
          <header className="border-b border-zinc-800/80 pb-3">
            <p className="font-serif text-[15px] text-zinc-200">Kristal Satın Al</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Uzman seansları için kristal yükleyin. Ödeme İyzico ile güvenli
              şekilde işlenir.
            </p>
          </header>

          <div className="mt-3 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                Kristal adedi
              </span>
              <input
                type="number"
                min={MIN_CRYSTAL_PURCHASE}
                step={1}
                inputMode="numeric"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                className={fieldClass}
                aria-invalid={Boolean(validationError)}
              />
              <span className="text-[10px] text-zinc-600">
                Minimum {MIN_CRYSTAL_PURCHASE} kristal
              </span>
            </label>

            <div className="rounded-sm border border-zinc-800 bg-zinc-950/50 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500">Birim fiyat</span>
                <span className="font-mono text-[12px] text-zinc-400">
                  ₺{DEFAULT_CRYSTAL_UNIT_TRY.toLocaleString("tr-TR")} / kristal
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-2">
                <span className="text-[11px] text-zinc-400">
                  <span aria-hidden className="text-red-500/85">
                    ◆
                  </span>{" "}
                  Toplam
                </span>
                <span className="font-mono text-[14px] text-zinc-200">
                  {totalTry !== null
                    ? `₺${totalTry.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </span>
              </div>
            </div>

            <div className="space-y-2 rounded-sm border border-zinc-800/90 bg-zinc-950/40 p-2.5">
              <LegalConsentRow
                checked={acceptedDistanceSelling}
                onCheckedChange={setAcceptedDistanceSelling}
                documentSlug="mesafeli-satis"
                linkLabel="Mesafeli Satış Sözleşmesi"
                suffix={` (${LEGAL_VERSION}) okudum, kabul ediyorum.`}
                onOpenDocument={setLegalDocSlug}
              />
              <LegalConsentRow
                checked={acceptedCayma}
                onCheckedChange={setAcceptedCayma}
                documentSlug="cayma-hakki"
                linkLabel="Cayma Hakkı"
                suffix={` (${LEGAL_VERSION}) kapsamında dijital kristal yüklemesinde cayma hakkımın sona erebileceğini kabul ediyorum.`}
                onOpenDocument={setLegalDocSlug}
              />
              <LegalConsentRow
                checked={acceptedInstantFulfillment}
                onCheckedChange={setAcceptedInstantFulfillment}
                documentSlug="dijital-ifa"
                linkLabel="Dijital İçerik Onayı"
                suffix={` (${LEGAL_VERSION}) kapsamında kristallerin ödeme sonrası anında yükleneceğini onaylıyorum.`}
                onOpenDocument={setLegalDocSlug}
              />
            </div>
          </div>

          {error || (validationError && amountInput.trim() !== "") ? (
            <p className="mt-3 text-[11px] text-zinc-500">{error ?? validationError}</p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-sm border border-zinc-800 py-2 text-[10px] uppercase tracking-wider text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-400"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={submitting || Boolean(validationError) || !checkoutConsentsReady}
              onClick={() => void handlePurchase()}
              className="flex-1 rounded-sm border border-zinc-700 py-2 text-[10px] uppercase tracking-wider text-zinc-200 transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "…" : "Satın Al"}
            </button>
          </div>
        </div>
      </div>

      <LegalDocumentModal
        slug={legalDocSlug}
        onClose={() => setLegalDocSlug(null)}
      />
    </>
  );
}
