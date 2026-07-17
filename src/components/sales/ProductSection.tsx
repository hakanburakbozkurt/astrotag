"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Package } from "lucide-react";
import { useGiftCheckout } from "@/hooks/useGiftCheckout";
import { useMotionReady } from "@/hooks/useMotionReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import ZodiacSelectionPanel from "@/components/sales/ZodiacSelectionPanel";
import {
  SALES_MOTION_EASE,
  SALES_SECTION_CLASS,
} from "@/lib/sales/sales-motion";
import {
  LUXURY_SHOWCASE_CARD_ASPECT_RATIO,
  LUXURY_SHOWCASE_CARD_IMAGE_CLASS,
  LUXURY_SHOWCASE_IMAGE_PATH,
  STAR_PACKAGE_IMAGE_CLASS,
  STAR_PACKAGE_IMAGE_PATH,
} from "@/lib/sales/luxury-showcase-image";
import {
  KEYCHAIN_BUNDLE_CATALOG,
  STAR_PACKAGE_CATALOG,
  createEmptyZodiacSelections,
  type GiftOrderDetails,
  type KeychainBundleProduct,
  type StarPackageProduct,
} from "@/lib/sales/star-packages-catalog";

const STAR_DIGITAL_IMAGE = STAR_PACKAGE_IMAGE_PATH;

const PRODUCT_GRID_CLASS = "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3";

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
  index: number;
  onSelect: () => void;
  selected?: boolean;
  className?: string;
  variant: "keychain" | "stars";
  badge?: string;
  featured?: boolean;
  spotlight?: boolean;
  vip?: boolean;
  kitQuantity?: number;
  giftStars?: number;
  freeShipping?: boolean;
  imageAspectRatio?: string;
  imageClassName?: string;
  children?: React.ReactNode;
}

function ProductCard({
  imageSrc,
  imageAlt,
  unoptimized = false,
  title,
  priceLabel,
  index,
  onSelect,
  selected,
  className = "",
  variant,
  badge,
  featured,
  spotlight,
  vip,
  kitQuantity,
  giftStars,
  freeShipping,
  imageAspectRatio,
  imageClassName,
  children,
}: ProductCardProps) {
  const motionReady = useMotionReady();
  const reducedMotion = usePrefersReducedMotion();
  const canAnimate = motionReady && !reducedMotion;

  const isStar = variant === "stars";
  const showStarBadge = isStar && Boolean(badge);

  return (
    <motion.article
      initial={canAnimate ? { opacity: 0, y: 16 } : false}
      animate={canAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease: SALES_MOTION_EASE, delay: index * 0.05 }}
      className={`flex flex-col overflow-hidden rounded-2xl border shadow-lg backdrop-blur-xl ${className} ${
        spotlight
          ? "col-span-2 border-amber-300/40 bg-gradient-to-br from-amber-400/[0.12] via-[#0f172a]/85 to-violet-950/30 shadow-[0_12px_40px_rgba(245,158,11,0.18)] lg:col-span-full"
          : vip || featured
            ? "border-amber-400/35 bg-amber-400/[0.06] shadow-[0_10px_32px_rgba(245,158,11,0.14)]"
            : selected
              ? "border-amber-400/45 bg-amber-400/[0.07] shadow-[0_10px_28px_rgba(245,158,11,0.12)]"
              : "border-white/10 bg-[#0f172a]/60 shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:border-white/18"
      }`}
    >
      <div
        className="relative w-full overflow-hidden bg-[#070b14]"
        style={{
          aspectRatio: imageAspectRatio ?? LUXURY_SHOWCASE_CARD_ASPECT_RATIO,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(245,158,11,0.22),transparent_72%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-2 rounded-xl bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.12),transparent_65%)] blur-sm"
          aria-hidden
        />
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          unoptimized={unoptimized}
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 280px"
          className={imageClassName ?? LUXURY_SHOWCASE_CARD_IMAGE_CLASS}
        />

        {showStarBadge ? (
          <span className="absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-full border border-amber-300/40 bg-[#070b14]/88 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-amber-50 backdrop-blur-md sm:left-3 sm:top-3 sm:px-2.5 sm:text-[9px]">
            {badge}
          </span>
        ) : null}

        {!isStar && vip && badge ? (
          <span className="absolute right-2 top-2 z-10 rounded-full border border-amber-300/45 bg-amber-400/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-amber-50 backdrop-blur-md sm:right-3 sm:top-3 sm:px-2.5 sm:text-[9px]">
            {badge}
          </span>
        ) : null}
      </div>

      {!isStar && kitQuantity ? (
        <div className="mx-2.5 mt-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-2 sm:mx-3 sm:mt-3 sm:px-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/90 sm:text-[11px]">
            <Package className="h-3 w-3 shrink-0 text-amber-400/80" aria-hidden />
            <span>{kitQuantity} Adet Kit</span>
          </div>
          {giftStars ? (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium text-emerald-300/95 sm:text-[11px]">
              <Gift className="h-3 w-3 shrink-0 text-emerald-400/80" aria-hidden />
              <span>+{giftStars.toLocaleString("tr-TR")} Hediye Yıldız</span>
            </div>
          ) : null}
          {freeShipping ? (
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-400/85 sm:text-[10px]">
              Ücretsiz Kargo
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white sm:text-base">
          {title}
        </h3>
        <p className="mt-1.5 text-lg font-semibold tabular-nums text-[#F59E0B] sm:text-xl">
          {priceLabel}
        </p>

        <button
          type="button"
          onClick={onSelect}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-[#F59E0B] px-3 py-2.5 text-xs font-semibold text-[#0f172a] shadow-[0_0_20px_rgba(245,158,11,0.22)] transition-[transform,opacity] duration-200 ease-out hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] sm:min-h-12 sm:text-sm"
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
    <div className={PRODUCT_GRID_CLASS}>
      {KEYCHAIN_BUNDLE_CATALOG.map((bundle, index) => {
        const selected = selectedId === bundle.id;
        const zodiacValues =
          zodiacByProduct[bundle.id] ?? createEmptyZodiacSelections(bundle.quantity);

        return (
          <ProductCard
            key={bundle.id}
            variant="keychain"
            imageSrc={LUXURY_SHOWCASE_IMAGE_PATH}
            imageAlt={`${bundle.title} — AstroTag burç anahtarlık kiti`}
            imageClassName={LUXURY_SHOWCASE_CARD_IMAGE_CLASS}
            unoptimized
            title={bundle.title}
            priceLabel={bundle.priceLabel}
            badge={bundle.badge}
            vip={bundle.vip}
            kitQuantity={bundle.quantity}
            giftStars={bundle.giftStars}
            freeShipping={bundle.freeShipping}
            className={bundle.vip ? "col-span-2 lg:col-span-full" : undefined}
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
              <div className="px-3 pb-3 sm:px-4 sm:pb-4">
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
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-400/35 bg-amber-400/10 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/18 sm:min-h-12 sm:text-sm"
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
    <div className={PRODUCT_GRID_CLASS}>
      {STAR_PACKAGE_CATALOG.map((product, index) => (
        <ProductCard
          key={product.id}
          variant="stars"
          imageSrc={STAR_DIGITAL_IMAGE}
          imageAlt={`${product.title} — ${product.stars.toLocaleString("tr-TR")} yıldız`}
          imageClassName={STAR_PACKAGE_IMAGE_CLASS}
          title={product.title}
          priceLabel={product.priceLabel}
          badge={product.badge}
          featured={product.featured}
          spotlight={product.spotlight}
          className={product.spotlight ? "col-span-2 lg:col-span-full" : undefined}
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
