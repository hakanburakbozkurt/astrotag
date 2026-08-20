"use client";

import { Gift } from "lucide-react";
import SalesMotion from "@/components/sales/SalesMotion";
import { GlassCard, LandingSection, SectionHeader } from "@/components/landing/landing-primitives";
import { useGiftCheckout } from "@/hooks/useGiftCheckout";
import {
  SALES_CTA_GIFT_CLASS,
  SALES_CTA_PRIMARY_CLASS,
  SALES_CTA_STACK_CLASS,
} from "@/lib/sales/sales-motion";
import {
  SALES_CTA_LABEL,
  SALES_GIFT_CTA_LABEL,
  STAR_BULK_DISCOUNT_START,
  STAR_PACKAGE_CATALOG,
  STAR_UNIT_PRICE_BASE_TRY,
  STAR_UNIT_PRICE_MIN_TRY,
  formatUnitPriceTry,
  type StarPackageProduct,
} from "@/lib/sales/star-packages-catalog";

interface StarPackageCarouselCardProps {
  product: StarPackageProduct;
  index: number;
  onPurchase: (product: StarPackageProduct) => void;
  onGift: (product: StarPackageProduct) => void;
}

function StarPackageCarouselCard({
  product,
  index,
  onPurchase,
  onGift,
}: StarPackageCarouselCardProps) {
  const isFeatured = Boolean(product.featured);
  const isSpotlight = Boolean(product.spotlight);
  const isHighlight = isFeatured || isSpotlight;

  return (
    <SalesMotion
      transition={{ delay: index * 0.04 }}
      className={`landing-carousel-item ${isHighlight ? "w-[min(85vw,340px)]" : "w-[min(76vw,280px)]"}`}
    >
      <GlassCard
        spotlight={isFeatured}
        className={`relative flex h-full flex-col overflow-hidden ${
          isSpotlight
            ? "border-violet-300/30 bg-gradient-to-br from-violet-400/[0.1] via-white/[0.03] to-amber-400/[0.08]"
            : ""
        }`}
      >
        {isFeatured ? (
          <>
            <div
              className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-amber-400/15 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-10 -top-8 h-32 w-32 rounded-full bg-violet-400/10 blur-3xl"
              aria-hidden
            />
          </>
        ) : null}

        <div className="relative flex flex-1 flex-col">
          {product.badge ? (
            <span
              className={`mb-3 inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${
                isFeatured
                  ? "border-amber-200/40 bg-amber-300/15 text-amber-50"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-100"
              }`}
            >
              {product.badge}
            </span>
          ) : null}

          <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
            {product.stars.toLocaleString("tr-TR")} Yıldız
          </p>
          <h3
            className={`landing-serif mt-1 text-white ${isHighlight ? "text-2xl" : "text-xl"}`}
          >
            {product.title}
          </h3>
          <p
            className={`mt-2 font-semibold tabular-nums text-amber-200/90 ${isHighlight ? "text-2xl" : "text-lg"}`}
          >
            {product.priceLabel}
          </p>
          <p className="mt-0.5 text-xs text-white/45">{product.unitPriceLabel}</p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-white/50">
            {product.description}
          </p>
        </div>

        <div className={SALES_CTA_STACK_CLASS}>
          <button
            type="button"
            onClick={() => onPurchase(product)}
            className={`${SALES_CTA_PRIMARY_CLASS} ${
              isFeatured
                ? "bg-gradient-to-r from-amber-300 to-amber-400 text-[#0a1020] shadow-[0_0_28px_rgba(251,191,36,0.3)]"
                : "border border-amber-400/25 bg-amber-400/10 text-amber-100 hover:bg-amber-400/18"
            }`}
          >
            {SALES_CTA_LABEL}
          </button>
          <button type="button" onClick={() => onGift(product)} className={SALES_CTA_GIFT_CLASS}>
            <Gift className="h-4 w-4 shrink-0" aria-hidden />
            {SALES_GIFT_CTA_LABEL}
          </button>
        </div>
      </GlassCard>
    </SalesMotion>
  );
}

export default function StarPackagesShowcase() {
  const { giftModal, openGiftModal, purchase } = useGiftCheckout();

  const sortedCatalog = [...STAR_PACKAGE_CATALOG].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    if (a.spotlight && !b.spotlight) return -1;
    if (!a.spotlight && b.spotlight) return 1;
    return 0;
  });

  return (
    <LandingSection id="yildiz-paketleri" bordered>
      <SectionHeader
        kicker="Yıldız Paketleri"
        title="Kozmik stok vitrini"
        subtitle={`${STAR_BULK_DISCOUNT_START} yıldız ve üzerinde birim fiyat ${formatUnitPriceTry(STAR_UNIT_PRICE_BASE_TRY)}'den ${formatUnitPriceTry(STAR_UNIT_PRICE_MIN_TRY)}'e kadar düşer.`}
      />

      <div className="landing-carousel -mx-4 mt-8 px-4 pb-2 sm:-mx-6 sm:px-6">
        {sortedCatalog.map((product, index) => (
          <StarPackageCarouselCard
            key={product.id}
            product={product}
            index={index}
            onPurchase={(item) => purchase(item.id, null)}
            onGift={(item) => openGiftModal(item.id, item.title)}
          />
        ))}
      </div>

      {giftModal}
    </LandingSection>
  );
}
