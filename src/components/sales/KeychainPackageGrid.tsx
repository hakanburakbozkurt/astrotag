"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Gift } from "lucide-react";
import SalesMotion from "@/components/sales/SalesMotion";
import { useGiftCheckout } from "@/hooks/useGiftCheckout";
import ZodiacSelectionPanel from "@/components/sales/ZodiacSelectionPanel";
import {
  SALES_CTA_GIFT_CLASS,
  SALES_CTA_PRIMARY_CLASS,
  SALES_CTA_STACK_CLASS,
  SALES_SECTION_CLASS,
} from "@/lib/sales/sales-motion";
import {
  KEYCHAIN_BUNDLE_CATALOG,
  SALES_CTA_LABEL,
  SALES_GIFT_CTA_LABEL,
  createEmptyZodiacSelections,
  type GiftOrderDetails,
  type KeychainBundleProduct,
} from "@/lib/sales/star-packages-catalog";

function areZodiacSelectionsComplete(values: string[]): boolean {
  return values.length > 0 && values.every((sign) => sign.trim().length > 0);
}

interface KeychainPackageCardProps {
  bundle: KeychainBundleProduct;
  index: number;
  selected: boolean;
  zodiacValues: string[];
  onSelect: () => void;
  onZodiacChange: (index: number, sign: string) => void;
  onPurchase: () => void;
  onGift: () => void;
}

function KeychainPackageCard({
  bundle,
  index,
  selected,
  zodiacValues,
  onSelect,
  onZodiacChange,
  onPurchase,
  onGift,
}: KeychainPackageCardProps) {
  const isVip = Boolean(bundle.vip);
  const zodiacReady = !selected || areZodiacSelectionsComplete(zodiacValues);

  return (
    <SalesMotion
      layout
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
      className={isVip ? "col-span-full" : undefined}
    >
      <article
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
        className={`relative flex h-full cursor-pointer flex-col rounded-[24px] border p-5 backdrop-blur-xl transition sm:p-6 ${
          isVip
            ? "border-2 border-amber-500 bg-gradient-to-br from-amber-400/[0.1] via-[#0f172a]/90 to-[#0f172a]/95 shadow-2xl"
            : selected
              ? "border-amber-400/45 bg-amber-400/[0.07] shadow-[0_0_36px_rgba(251,191,36,0.14)]"
              : "border-white/10 bg-[#0f172a]/72 hover:border-white/18"
        }`}
      >
        {bundle.badge ? (
          <span
            className={`mb-3 inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${
              isVip
                ? "border-amber-300/50 bg-amber-400/15 text-amber-100"
                : "border-amber-400/30 bg-amber-400/10 text-amber-100"
            }`}
          >
            {bundle.badge}
          </span>
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
              {bundle.quantity} Adet Anahtarlık
            </p>
            <h3 className={`mt-1 font-semibold text-white ${isVip ? "text-xl sm:text-2xl" : "text-lg"}`}>
              {bundle.title}
            </h3>
          </div>
          <p
            className={`shrink-0 font-semibold tabular-nums text-amber-200/90 ${isVip ? "text-2xl" : "text-lg"}`}
          >
            {bundle.priceLabel}
          </p>
        </div>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">{bundle.description}</p>

        <p className="mt-4 text-sm font-bold text-emerald-400">
          Toplamda {bundle.giftStars.toLocaleString("tr-TR")} adet Hediye Yıldız Kazanın!
        </p>

        <p
          className={`mt-2 text-xs font-semibold uppercase tracking-[0.12em] ${
            bundle.freeShipping ? "text-emerald-400" : "text-white/45"
          }`}
        >
          {bundle.shippingNote}
        </p>

        <div className={SALES_CTA_STACK_CLASS} onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={onPurchase}
            disabled={selected && !zodiacReady}
            className={`${SALES_CTA_PRIMARY_CLASS} disabled:cursor-not-allowed disabled:opacity-45 ${
              isVip
                ? "bg-gradient-to-r from-amber-300 to-amber-400 text-[#0f172a] hover:from-amber-200 hover:to-amber-300"
                : "bg-amber-400/95 text-[#0f172a] hover:bg-amber-300"
            }`}
          >
            {SALES_CTA_LABEL}
          </button>

          <button type="button" onClick={onGift} className={SALES_CTA_GIFT_CLASS}>
            <Gift className="h-4 w-4 shrink-0" aria-hidden />
            {SALES_GIFT_CTA_LABEL}
          </button>
        </div>
      </article>

      <AnimatePresence initial={false}>
        {selected ? (
          <ZodiacSelectionPanel
            quantity={bundle.quantity}
            values={zodiacValues}
            onChange={onZodiacChange}
          />
        ) : null}
      </AnimatePresence>
    </SalesMotion>
  );
}

export default function KeychainPackageGrid() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zodiacByProduct, setZodiacByProduct] = useState<Record<string, string[]>>({});
  const [pendingGiftByProduct, setPendingGiftByProduct] = useState<
    Record<string, GiftOrderDetails>
  >({});

  const { giftModal, openGiftModal, purchase } = useGiftCheckout({
    getCheckoutOptions: (productId) => {
      const signs = zodiacByProduct[productId]?.filter(Boolean);
      return signs?.length ? { zodiacSigns: signs } : undefined;
    },
    canProceedToCheckout: (productId) => {
      const bundle = KEYCHAIN_BUNDLE_CATALOG.find((item) => item.id === productId);
      if (!bundle) {
        return true;
      }
      const signs = zodiacByProduct[productId] ?? createEmptyZodiacSelections(bundle.quantity);
      return areZodiacSelectionsComplete(signs);
    },
    onGiftPending: (productId, details) => {
      setPendingGiftByProduct((current) => ({ ...current, [productId]: details }));
    },
  });

  const ensureZodiacState = useCallback((bundle: KeychainBundleProduct) => {
    setZodiacByProduct((current) => {
      if (current[bundle.id]?.length === bundle.quantity) {
        return current;
      }
      return {
        ...current,
        [bundle.id]: createEmptyZodiacSelections(bundle.quantity),
      };
    });
  }, []);

  const handleSelect = useCallback(
    (bundle: KeychainBundleProduct) => {
      setSelectedId(bundle.id);
      ensureZodiacState(bundle);
    },
    [ensureZodiacState]
  );

  const handleZodiacChange = useCallback(
    (productId: string, index: number, sign: string) => {
      setZodiacByProduct((current) => {
        const nextValues = [...(current[productId] ?? [])];
        nextValues[index] = sign;
        return { ...current, [productId]: nextValues };
      });
    },
    []
  );

  const handlePurchase = useCallback(
    (bundle: KeychainBundleProduct) => {
      handleSelect(bundle);
      const signs = zodiacByProduct[bundle.id] ?? createEmptyZodiacSelections(bundle.quantity);

      if (!areZodiacSelectionsComplete(signs)) {
        return;
      }

      purchase(bundle.id, pendingGiftByProduct[bundle.id] ?? null);
    },
    [handleSelect, pendingGiftByProduct, purchase, zodiacByProduct]
  );

  const handleGiftOpen = useCallback(
    (bundle: KeychainBundleProduct) => {
      handleSelect(bundle);
      openGiftModal(bundle.id, bundle.title);
    },
    [handleSelect, openGiftModal]
  );

  return (
    <section id="anahtarlik-paketleri" className={SALES_SECTION_CLASS}>
      <div className="mx-auto max-w-5xl">
        <p className="sales-kicker text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
          NFC Anahtarlık Paketleri
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Lüks Koleksiyon Vitrini
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Paketinizi seçin, burç kişiselleştirmesini tamamlayın ve kozmik yolculuğa
          başlayın. Çoklu paketlerde ücretsiz kargo ve hediye yıldız bonusu.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KEYCHAIN_BUNDLE_CATALOG.map((bundle, index) => (
            <KeychainPackageCard
              key={bundle.id}
              bundle={bundle}
              index={index}
              selected={selectedId === bundle.id}
              zodiacValues={
                zodiacByProduct[bundle.id] ?? createEmptyZodiacSelections(bundle.quantity)
              }
              onSelect={() => handleSelect(bundle)}
              onZodiacChange={(signIndex, sign) =>
                handleZodiacChange(bundle.id, signIndex, sign)
              }
              onPurchase={() => handlePurchase(bundle)}
              onGift={() => handleGiftOpen(bundle)}
            />
          ))}
        </div>
      </div>

      {giftModal}
    </section>
  );
}
