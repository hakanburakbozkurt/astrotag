"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { Gift, Package, Radio } from "lucide-react";
import SalesMotion from "@/components/sales/SalesMotion";
import ZodiacSelectionPanel from "@/components/sales/ZodiacSelectionPanel";
import { GlassCard, LandingSection, SectionHeader } from "@/components/landing/landing-primitives";
import { LANDING_CTA_PRIMARY } from "@/components/landing/landing-motion";
import { useGiftCheckout } from "@/hooks/useGiftCheckout";
import {
  LUXURY_SHOWCASE_ASPECT_RATIO,
  LUXURY_SHOWCASE_CARD_IMAGE_CLASS,
  LUXURY_SHOWCASE_IMAGE_PATH,
} from "@/lib/sales/luxury-showcase-image";
import {
  KEYCHAIN_BUNDLE_CATALOG,
  NFC_KEYCHAIN_PRODUCT,
  SALES_CTA_LABEL,
  createEmptyZodiacSelections,
  type KeychainBundleProduct,
  type PurchaseOptions,
} from "@/lib/sales/star-packages-catalog";

function areZodiacSelectionsComplete(values: string[]): boolean {
  return values.length > 0 && values.every((sign) => sign.trim().length > 0);
}

interface KeychainCarouselCardProps {
  bundle: KeychainBundleProduct;
  selected: boolean;
  zodiacValues: string[];
  onSelect: () => void;
  onZodiacChange: (index: number, sign: string) => void;
  onPurchase: () => void;
}

function KeychainCarouselCard({
  bundle,
  selected,
  zodiacValues,
  onSelect,
  onZodiacChange,
  onPurchase,
}: KeychainCarouselCardProps) {
  const isFeatured = Boolean(bundle.badge);

  return (
    <article
      className={`landing-carousel-item w-[min(78vw,300px)] ${
        isFeatured ? "w-[min(82vw,320px)]" : ""
      }`}
    >
      <GlassCard
        spotlight={isFeatured}
        className={`flex h-full flex-col overflow-hidden p-0 ${bundle.vip ? "border-amber-300/35" : ""}`}
      >
        <div
          className="relative w-full overflow-hidden bg-[#030614]"
          style={{ aspectRatio: "4 / 3" }}
        >
          <Image
            src={LUXURY_SHOWCASE_IMAGE_PATH}
            alt={`${bundle.title} — AstroTag NFC koleksiyon`}
            fill
            loading="lazy"
            unoptimized
            sizes="300px"
            className={LUXURY_SHOWCASE_CARD_IMAGE_CLASS}
          />
          {bundle.badge ? (
            <span className="absolute left-3 top-3 rounded-full border border-amber-300/35 bg-[#030614]/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-50 backdrop-blur-md">
              {bundle.badge}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
            {bundle.quantity} Adet · +{bundle.giftStars} Yıldız
          </p>
          <h3 className="landing-serif mt-1 text-xl text-white">{bundle.title}</h3>
          <p className="mt-1.5 text-lg font-semibold tabular-nums text-amber-200/90">
            {bundle.priceLabel}
          </p>
          <p className="mt-2 flex-1 text-xs leading-relaxed text-white/48">
            {bundle.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-wide text-white/45">
            <span className="inline-flex items-center gap-1">
              <Package className="h-3 w-3 text-amber-400/70" aria-hidden />
              Kit
            </span>
            <span className="inline-flex items-center gap-1">
              <Gift className="h-3 w-3 text-emerald-400/70" aria-hidden />
              Hediye yıldız
            </span>
            {bundle.freeShipping ? (
              <span className="text-emerald-400/80">Ücretsiz kargo</span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onSelect}
            className={`mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
              selected
                ? "border border-amber-400/35 bg-amber-400/12 text-amber-100"
                : "bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1020]"
            }`}
          >
            {selected ? "Burç Seçimini Tamamla" : "Hemen Seç"}
          </button>

          {selected ? (
            <div className="mt-3">
              <AnimatePresence initial={false}>
                <ZodiacSelectionPanel
                  quantity={bundle.quantity}
                  values={zodiacValues}
                  onChange={onZodiacChange}
                />
              </AnimatePresence>
              {areZodiacSelectionsComplete(zodiacValues) ? (
                <button
                  type="button"
                  onClick={onPurchase}
                  className={`${LANDING_CTA_PRIMARY} mt-3`}
                >
                  {SALES_CTA_LABEL}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </GlassCard>
    </article>
  );
}

export default function NfcProductShowcase() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zodiacByProduct, setZodiacByProduct] = useState<Record<string, string[]>>({});

  const getCheckoutOptions = useCallback(
    (productId: string): PurchaseOptions | undefined => {
      const signs = zodiacByProduct[productId];
      if (!signs?.length) {
        return undefined;
      }
      return { zodiacSigns: signs };
    },
    [zodiacByProduct]
  );

  const canProceedToCheckout = useCallback(
    (productId: string) => areZodiacSelectionsComplete(zodiacByProduct[productId] ?? []),
    [zodiacByProduct]
  );

  const { giftModal, purchase } = useGiftCheckout({
    getCheckoutOptions,
    canProceedToCheckout,
  });

  const handleSelect = useCallback((bundle: KeychainBundleProduct) => {
    setSelectedId(bundle.id);
    setZodiacByProduct((current) => {
      if (current[bundle.id]) {
        return current;
      }
      return {
        ...current,
        [bundle.id]: createEmptyZodiacSelections(bundle.quantity),
      };
    });
  }, []);

  const handleZodiacChange = useCallback(
    (productId: string, index: number, sign: string) => {
      setZodiacByProduct((current) => {
        const values = [...(current[productId] ?? createEmptyZodiacSelections(1))];
        values[index] = sign;
        return { ...current, [productId]: values };
      });
    },
    []
  );

  const handlePurchase = useCallback(
    (bundle: KeychainBundleProduct) => {
      const signs = zodiacByProduct[bundle.id];
      if (!areZodiacSelectionsComplete(signs ?? [])) {
        setSelectedId(bundle.id);
        return;
      }
      purchase(bundle.id, null);
    },
    [purchase, zodiacByProduct]
  );

  const showcaseBundles = KEYCHAIN_BUNDLE_CATALOG.filter(
    (bundle) => bundle.badge || bundle.vip || bundle.quantity <= 2
  ).slice(0, 4);

  return (
    <LandingSection id="koleksiyon" bordered>
      <SectionHeader
        kicker="Fiziksel · Dijital"
        title="NFC Koleksiyon Vitrini"
        subtitle={NFC_KEYCHAIN_PRODUCT.description}
      />

      <SalesMotion className="mt-8">
        <div
          className="landing-glass relative mx-auto overflow-hidden rounded-[28px]"
          style={{ aspectRatio: LUXURY_SHOWCASE_ASPECT_RATIO }}
        >
          <Image
            src={LUXURY_SHOWCASE_IMAGE_PATH}
            alt="AstroTag lüks NFC anahtarlık koleksiyonu"
            fill
            priority={false}
            loading="lazy"
            unoptimized
            sizes="(max-width: 512px) 100vw, 512px"
            className="object-cover object-left"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030614] via-[#030614]/40 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-[#030614]/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-200/90 backdrop-blur-md">
              <Radio className="h-3 w-3" aria-hidden />
              {NFC_KEYCHAIN_PRODUCT.badge}
            </span>
            <h3 className="landing-serif mt-3 text-2xl text-white">
              {NFC_KEYCHAIN_PRODUCT.title} Koleksiyonu
            </h3>
            <p className="mt-1 text-sm text-white/55">
              Telefonuna dokundur — kozmik profilin anında açılsın.
            </p>
            <p className="mt-2 text-lg font-semibold text-amber-200/90">
              {NFC_KEYCHAIN_PRODUCT.priceLabel}&apos;den başlayan fiyatlar
            </p>
          </div>
        </div>
      </SalesMotion>

      <div className="landing-carousel -mx-4 mt-8 px-4 pb-1 sm:-mx-6 sm:px-6">
        {showcaseBundles.map((bundle) => {
          const zodiacValues =
            zodiacByProduct[bundle.id] ?? createEmptyZodiacSelections(bundle.quantity);

          return (
            <KeychainCarouselCard
              key={bundle.id}
              bundle={bundle}
              selected={selectedId === bundle.id}
              zodiacValues={zodiacValues}
              onSelect={() => handleSelect(bundle)}
              onZodiacChange={(index, sign) => handleZodiacChange(bundle.id, index, sign)}
              onPurchase={() => handlePurchase(bundle)}
            />
          );
        })}
      </div>

      {giftModal}
    </LandingSection>
  );
}
