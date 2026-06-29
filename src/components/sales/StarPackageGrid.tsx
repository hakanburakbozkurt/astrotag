"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  buildPurchaseSuccessUrl,
  SALES_CTA_LABEL,
  STAR_BULK_DISCOUNT_START,
  STAR_PACKAGE_CATALOG,
  STAR_UNIT_PRICE_BASE_TRY,
  STAR_UNIT_PRICE_MIN_TRY,
  formatUnitPriceTry,
  type StarPackageProduct,
} from "@/lib/sales/star-packages-catalog";

function PackageCard({ product, index }: { product: StarPackageProduct; index: number }) {
  const router = useRouter();
  const isFeatured = Boolean(product.featured);
  const isSpotlight = Boolean(product.spotlight);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col rounded-[24px] border p-5 backdrop-blur-xl sm:p-6 ${
        isSpotlight
          ? "sales-spotlight-card col-span-full overflow-hidden border-amber-300/45 bg-gradient-to-br from-amber-400/[0.14] via-[#0f172a]/90 to-violet-950/40 p-6 shadow-[0_0_80px_rgba(251,191,36,0.22)] sm:p-8 lg:flex-row lg:items-center lg:gap-10"
          : isFeatured
            ? "border-amber-400/35 bg-amber-400/[0.08] shadow-[0_0_40px_rgba(251,191,36,0.12)]"
            : "border-white/10 bg-[#0f172a]/72"
      }`}
    >
      {isSpotlight ? (
        <>
          <div
            className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-amber-400/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl"
            aria-hidden
          />
        </>
      ) : null}

      <div className={isSpotlight ? "relative flex-1" : undefined}>
        {product.badge ? (
          <span
            className={`mb-3 inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${
              isSpotlight
                ? "border-amber-200/40 bg-amber-300/15 text-amber-50"
                : "border-amber-400/30 bg-amber-400/10 text-amber-100"
            }`}
          >
            {product.badge}
          </span>
        ) : null}

        <div className={`flex gap-3 ${isSpotlight ? "flex-col sm:flex-row sm:items-end sm:justify-between" : "items-baseline justify-between"}`}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
              {product.stars.toLocaleString("tr-TR")} Yıldız
            </p>
            <h3
              className={`font-semibold text-white ${isSpotlight ? "mt-1 text-2xl sm:text-3xl" : "text-lg"}`}
            >
              {product.title}
            </h3>
          </div>
          <div className={isSpotlight ? "sm:text-right" : undefined}>
            <p
              className={`font-semibold tabular-nums text-amber-200/90 ${isSpotlight ? "text-3xl sm:text-4xl" : "text-lg"}`}
            >
              {product.priceLabel}
            </p>
            <p className="mt-1 text-xs text-white/45">{product.unitPriceLabel}</p>
          </div>
        </div>

        <p
          className={`leading-relaxed text-white/50 ${isSpotlight ? "mt-4 max-w-2xl text-sm sm:text-base" : "mt-2 flex-1 text-sm"}`}
        >
          {product.description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => router.push(buildPurchaseSuccessUrl(product.id))}
        className={`relative mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
          isSpotlight
            ? "min-h-12 bg-gradient-to-r from-amber-300 to-amber-400 text-[#0f172a] shadow-[0_0_32px_rgba(251,191,36,0.35)] hover:from-amber-200 hover:to-amber-300 lg:mt-0 lg:w-auto lg:shrink-0 lg:px-8"
            : isFeatured
              ? "min-h-11 bg-amber-400/95 text-[#0f172a] hover:bg-amber-300"
              : "min-h-11 border border-amber-400/25 bg-amber-400/10 text-amber-100 hover:bg-amber-400/18"
        }`}
      >
        {SALES_CTA_LABEL}
      </button>
    </motion.article>
  );
}

export default function StarPackageGrid() {
  return (
    <section id="yildiz-paketleri" className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <p className="sales-kicker text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
          Yıldız Paketleri
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Kozmik Stok Vitrini</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          15 yıldızdan 2.500 yıldıza kadar isimlendirilmiş paketler.{" "}
          {STAR_BULK_DISCOUNT_START} yıldız ve üzerinde birim fiyat{" "}
          {formatUnitPriceTry(STAR_UNIT_PRICE_BASE_TRY)}&apos;den{" "}
          {formatUnitPriceTry(STAR_UNIT_PRICE_MIN_TRY)}&apos;e kadar düşer.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAR_PACKAGE_CATALOG.map((product, index) => (
            <PackageCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
