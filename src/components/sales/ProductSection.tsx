"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useGiftCheckout } from "@/hooks/useGiftCheckout";
import { useMotionReady } from "@/hooks/useMotionReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import ZodiacSelectionPanel from "@/components/sales/ZodiacSelectionPanel";
import {
  SALES_MOTION_EASE,
  SALES_SECTION_CLASS,
} from "@/lib/sales/sales-motion";
import {
  LUXURY_SHOWCASE_ASPECT_RATIO,
  LUXURY_SHOWCASE_IMAGE_PATH,
} from "@/lib/sales/luxury-showcase-image";
import {
  KEYCHAIN_BUNDLE_CATALOG,
  STAR_PACKAGE_CATALOG,
  createEmptyZodiacSelections,
  type GiftOrderDetails,
  type KeychainBundleProduct,
  type StarPackageProduct,
} from "@/lib/sales/star-packages-catalog";

const STAR_DIGITAL_IMAGE = "/assets/sales/star-digital.svg";

type ProductCategory = "keychain" | "stars";

const TABS: { id: ProductCategory; label: string; subtitle: string }[] = [
  { id: "keychain", label: "Anahtarlık Koleksiyonu", subtitle: "Fiziksel" },
  { id: "stars", label: "Yıldız Paketleri", subtitle: "Dijital" },
];

function areZodiacSelectionsComplete(values: string[]): boolean {
  return values.length > 0 && values.every((sign) => sign.trim().length > 0);
}

interface ProductCardProps {
  imageSrc: string;
  imageAlt: string;
  unoptimized?: boolean;
  title: string;
  priceLabel: string;
  badge?: string;
  featured?: boolean;
  spotlight?: boolean;
  vip?: boolean;
  index: number;
  onSelect: () => void;
  selected?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function ProductCard({
  imageSrc,
  imageAlt,
  unoptimized = false,
  title,
  priceLabel,
  badge,
  featured,
  spotlight,
  vip,
  index,
  onSelect,
  selected,
  className = "",
  children,
}: ProductCardProps) {
  const motionReady = useMotionReady();
  const reducedMotion = usePrefersReducedMotion();
  const canAnimate = motionReady && !reducedMotion;

  return (
    <motion.article
      initial={canAnimate ? { opacity: 0, y: 16 } : false}
      animate={canAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease: SALES_MOTION_EASE, delay: index * 0.05 }}
      className={`flex flex-col overflow-hidden rounded-[24px] border backdrop-blur-xl ${className} ${
        spotlight
          ? "col-span-full border-amber-300/40 bg-gradient-to-br from-amber-400/[0.12] via-[#0f172a]/80 to-violet-950/30 shadow-[0_0_60px_rgba(245,158,11,0.15)]"
          : vip || featured
            ? "border-amber-400/35 bg-amber-400/[0.06] shadow-[0_0_32px_rgba(245,158,11,0.1)]"
            : selected
              ? "border-amber-400/45 bg-amber-400/[0.07]"
              : "border-white/10 bg-[#0f172a]/55 hover:border-white/18"
      }`}
    >
      <div
        className="relative w-full bg-[#070b14]"
        style={{ aspectRatio: String(LUXURY_SHOWCASE_ASPECT_RATIO) }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          unoptimized={unoptimized}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          className="object-contain object-center p-4"
        />
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full border border-amber-400/30 bg-[#070b14]/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-100 backdrop-blur-sm">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-base font-semibold text-white sm:text-lg">{title}</h3>
        <p className="mt-1 text-xl font-semibold tabular-nums text-[#F59E0B]">{priceLabel}</p>

        <button
          type="button"
          onClick={onSelect}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-[#F59E0B] px-4 py-3 text-sm font-semibold text-[#0f172a] shadow-[0_0_24px_rgba(245,158,11,0.2)] transition-[transform,opacity] duration-200 ease-out hover:from-amber-300 hover:to-amber-400 active:scale-[0.98]"
        >
          Hemen Seç
        </button>
      </div>

      {children}
    </motion.article>
  );
}

function KeychainShowcase({
  selectedId,
  zodiacByProduct,
  onSelect,
  onZodiacChange,
  onPurchase,
}: {
  selectedId: string | null;
  zodiacByProduct: Record<string, string[]>;
  onSelect: (bundle: KeychainBundleProduct) => void;
  onZodiacChange: (productId: string, index: number, sign: string) => void;
  onPurchase: (bundle: KeychainBundleProduct) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {KEYCHAIN_BUNDLE_CATALOG.map((bundle, index) => {
        const selected = selectedId === bundle.id;
        const zodiacValues =
          zodiacByProduct[bundle.id] ?? createEmptyZodiacSelections(bundle.quantity);

        return (
          <ProductCard
            key={bundle.id}
            imageSrc={LUXURY_SHOWCASE_IMAGE_PATH}
            imageAlt={bundle.title}
            unoptimized
            title={bundle.title}
            priceLabel={bundle.priceLabel}
            badge={bundle.badge}
            vip={bundle.vip}
            className={bundle.vip ? "col-span-full" : undefined}
            index={index}
            selected={selected}
            onSelect={() => {
              onSelect(bundle);
              if (areZodiacSelectionsComplete(zodiacValues)) {
                onPurchase(bundle);
              }
            }}
          >
            {selected ? (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <AnimatePresence initial={false}>
                  <ZodiacSelectionPanel
                    quantity={bundle.quantity}
                    values={zodiacValues}
                    onChange={(signIndex, sign) => onZodiacChange(bundle.id, signIndex, sign)}
                  />
                </AnimatePresence>
                {areZodiacSelectionsComplete(zodiacValues) ? (
                  <button
                    type="button"
                    onClick={() => onPurchase(bundle)}
                    className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-amber-400/35 bg-amber-400/10 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/18"
                  >
                    Siparişi Tamamla
                  </button>
                ) : null}
              </div>
            ) : null}
          </ProductCard>
        );
      })}
    </div>
  );
}

function StarShowcase({
  onPurchase,
}: {
  onPurchase: (product: StarPackageProduct) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {STAR_PACKAGE_CATALOG.map((product, index) => (
        <ProductCard
          key={product.id}
          imageSrc={STAR_DIGITAL_IMAGE}
          imageAlt={`${product.title} — ${product.stars} yıldız`}
          title={product.title}
          priceLabel={product.priceLabel}
          badge={product.badge}
          featured={product.featured}
          spotlight={product.spotlight}
          className={product.spotlight ? "col-span-full" : undefined}
          index={index}
          onSelect={() => onPurchase(product)}
        />
      ))}
    </div>
  );
}

export default function ProductSection() {
  const [activeTab, setActiveTab] = useState<ProductCategory>("keychain");
  const [selectedKeychainId, setSelectedKeychainId] = useState<string | null>(null);
  const [zodiacByProduct, setZodiacByProduct] = useState<Record<string, string[]>>({});
  const [pendingGiftByProduct, setPendingGiftByProduct] = useState<
    Record<string, GiftOrderDetails>
  >({});

  const motionReady = useMotionReady();
  const reducedMotion = usePrefersReducedMotion();
  const canAnimate = motionReady && !reducedMotion;

  const { giftModal, purchase } = useGiftCheckout({
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

  const handleKeychainSelect = useCallback(
    (bundle: KeychainBundleProduct) => {
      setSelectedKeychainId(bundle.id);
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

  const handleKeychainPurchase = useCallback(
    (bundle: KeychainBundleProduct) => {
      handleKeychainSelect(bundle);
      const signs = zodiacByProduct[bundle.id] ?? createEmptyZodiacSelections(bundle.quantity);
      if (!areZodiacSelectionsComplete(signs)) {
        return;
      }
      purchase(bundle.id, pendingGiftByProduct[bundle.id] ?? null);
    },
    [handleKeychainSelect, pendingGiftByProduct, purchase, zodiacByProduct]
  );

  const handleStarPurchase = useCallback(
    (product: StarPackageProduct) => {
      purchase(product.id, null);
    },
    [purchase]
  );

  return (
    <section id="paketler" className={`${SALES_SECTION_CLASS} border-b border-white/[0.06]`}>
      <div className="mx-auto max-w-5xl">
        <p className="sales-kicker text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
          Paketler
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Kozmik Koleksiyon Vitrini
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Fiziksel anahtarlık koleksiyonu veya dijital yıldız paketleri — ihtiyacına göre seç,
          hemen yolculuğa başla.
        </p>

        <div
          className="mt-8 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#0f172a]/40 p-1.5 backdrop-blur-xl sm:gap-3 sm:p-2"
          role="tablist"
          aria-label="Ürün kategorileri"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-3 text-center transition-[background-color,border-color,box-shadow,color] duration-200 ease-out sm:min-h-14 sm:px-4 ${
                  isActive
                    ? "border border-[#F59E0B]/40 bg-[#F59E0B]/15 text-amber-50 shadow-[0_0_24px_rgba(245,158,11,0.12)]"
                    : "border border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <span className="text-xs font-semibold sm:text-sm">{tab.label}</span>
                <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40 sm:text-[10px]">
                  {tab.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8" role="tabpanel">
          <AnimatePresence mode="wait">
            {activeTab === "keychain" ? (
              <motion.div
                key="keychain-panel"
                initial={canAnimate ? { opacity: 0, y: 12 } : false}
                animate={canAnimate ? { opacity: 1, y: 0 } : undefined}
                exit={canAnimate ? { opacity: 0, y: -8 } : undefined}
                transition={{ duration: 0.4, ease: SALES_MOTION_EASE }}
              >
                <KeychainShowcase
                  selectedId={selectedKeychainId}
                  zodiacByProduct={zodiacByProduct}
                  onSelect={handleKeychainSelect}
                  onZodiacChange={handleZodiacChange}
                  onPurchase={handleKeychainPurchase}
                />
              </motion.div>
            ) : (
              <motion.div
                key="stars-panel"
                initial={canAnimate ? { opacity: 0, y: 12 } : false}
                animate={canAnimate ? { opacity: 1, y: 0 } : undefined}
                exit={canAnimate ? { opacity: 0, y: -8 } : undefined}
                transition={{ duration: 0.4, ease: SALES_MOTION_EASE }}
              >
                <StarShowcase onPurchase={handleStarPurchase} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {giftModal}
    </section>
  );
}
