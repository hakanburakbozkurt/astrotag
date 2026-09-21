"use client";

import { useEffect, useState } from "react";
import LegalConsentRow from "@/components/legal/LegalConsentRow";
import LegalDocumentModal from "@/components/legal/LegalDocumentModal";
import {
  initCrystalCheckoutAction,
  listCrystalPackagesAction,
} from "@/lib/actions/wallet";
import { LEGAL_VERSION } from "@/lib/legal/consent-config";
import type { LegalDocumentSlug } from "@/lib/legal/legal-document-slugs";

type CrystalPackage = Awaited<ReturnType<typeof listCrystalPackagesAction>>[number];

type CrystalCheckoutModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const fieldShell =
  "rounded-sm border border-zinc-800 bg-[#09090b]";

export default function CrystalCheckoutModal({
  open,
  onClose,
  onSuccess,
}: CrystalCheckoutModalProps) {
  const [packages, setPackages] = useState<CrystalPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [acceptedDistanceSelling, setAcceptedDistanceSelling] = useState(false);
  const [acceptedCayma, setAcceptedCayma] = useState(false);
  const [acceptedInstantFulfillment, setAcceptedInstantFulfillment] = useState(false);
  const [legalDocSlug, setLegalDocSlug] = useState<LegalDocumentSlug | null>(null);

  const checkoutConsentsReady =
    acceptedDistanceSelling && acceptedCayma && acceptedInstantFulfillment;

  useEffect(() => {
    if (!open) {
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await listCrystalPackagesAction();
        setPackages(rows);
      } catch {
        setError("Paketler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setLegalDocSlug(null);
    }
  }, [open]);

  const handlePurchase = async (packageId: string) => {
    if (!checkoutConsentsReady) {
      setError("Devam etmek için mesafeli satış ve dijital ifa onaylarını kabul edin.");
      return;
    }

    setBusyId(packageId);
    setError(null);

    try {
      const result = await initCrystalCheckoutAction(packageId, [
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
      onSuccess?.();
    } catch {
      setError("Ödeme başlatılamadı.");
    } finally {
      setBusyId(null);
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
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-label="Kristal satın al"
          onClick={(event) => event.stopPropagation()}
          className={`w-full max-w-md ${fieldShell} p-4 shadow-[0_0_24px_rgba(239,68,68,0.06)]`}
        >
          <header className="border-b border-zinc-800/80 pb-3">
            <p className="font-serif text-[15px] text-zinc-200">Kristal Cüzdan</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Uzman seansları için kristal yükleyin. Ödeme İyzico Sandbox ile
              güvenli şekilde işlenir.
            </p>
          </header>

          {loading ? (
            <p className="mt-4 text-[12px] text-zinc-600">Paketler yükleniyor…</p>
          ) : (
            <>
              <div className="mt-3 space-y-2 rounded-sm border border-zinc-800/90 bg-zinc-950/40 p-2.5">
                <LegalConsentRow
                  checked={acceptedDistanceSelling}
                  onCheckedChange={setAcceptedDistanceSelling}
                  documentSlug="mesafeli-satis"
                  linkLabel="Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu"
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
                  suffix={` (${LEGAL_VERSION}) kapsamında kristallerin ödeme sonrası anında dijital hesabıma yükleneceğini onaylıyorum.`}
                  onOpenDocument={setLegalDocSlug}
                />
              </div>

              <ul className="mt-3 space-y-2">
                {packages.map((pkg) => (
                  <li key={pkg.id}>
                    <button
                      type="button"
                      disabled={busyId !== null || !checkoutConsentsReady}
                      onClick={() => void handlePurchase(pkg.id)}
                      className="flex w-full items-center justify-between rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2.5 text-left transition hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div>
                        <p className="text-[13px] text-zinc-200">
                          {pkg.title}
                          {pkg.badge ? (
                            <span className="ml-2 text-[9px] uppercase tracking-wider text-zinc-500">
                              {pkg.badge}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          <span aria-hidden className="text-red-500/85">
                            ◆
                          </span>{" "}
                          {pkg.crystals} Kristal
                        </p>
                      </div>
                      <span className="font-mono text-[12px] text-zinc-400">
                        {busyId === pkg.id ? "…" : `₺${pkg.priceTry}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {error ? <p className="mt-3 text-[11px] text-zinc-500">{error}</p> : null}

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-sm border border-zinc-800 py-2 text-[10px] uppercase tracking-wider text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-400"
          >
            Kapat
          </button>
        </div>
      </div>

      <LegalDocumentModal
        slug={legalDocSlug}
        onClose={() => setLegalDocSlug(null)}
      />
    </>
  );
}
