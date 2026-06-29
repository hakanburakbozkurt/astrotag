"use client";

import SalesMotion from "@/components/sales/SalesMotion";
import {
  SALES_JOURNEY_TAGLINE,
  SALES_MOTION_TRANSITION,
  SALES_SECTION_CLASS,
} from "@/lib/sales/sales-motion";
import { NFC_KEYCHAIN_PRODUCT } from "@/lib/sales/star-packages-catalog";

export default function SalesHero() {
  return (
    <section className={`${SALES_SECTION_CLASS} border-b border-white/[0.06]`}>
      <SalesMotion
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SALES_MOTION_TRANSITION, delay: 0.08 }}
        className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-end lg:gap-12"
      >
        <div className="flex flex-col gap-4 text-center lg:text-left">
          <p className="sales-kicker font-mono text-[10px] uppercase tracking-[0.38em] text-amber-400/70">
            {SALES_JOURNEY_TAGLINE}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
            {NFC_KEYCHAIN_PRODUCT.badge}
          </p>
          <h1 className="sales-title bg-gradient-to-b from-white via-amber-50 to-amber-300/90 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
            {NFC_KEYCHAIN_PRODUCT.title}
          </h1>
        </div>

        <div className="flex flex-col gap-4 text-center lg:text-left">
          <p className="sales-subtitle text-sm leading-relaxed text-white/55 sm:text-base">
            {NFC_KEYCHAIN_PRODUCT.description}
          </p>
          <p className="text-sm text-white/40">
            Paketler{" "}
            <span className="font-semibold text-amber-200/90">
              {NFC_KEYCHAIN_PRODUCT.priceLabel}
            </span>
            &apos;den başlayan fiyatlarla — yıldız stokunuzu yükleyin veya anahtarlık
            vitrininden seçim yapın.
          </p>
        </div>
      </SalesMotion>
    </section>
  );
}
