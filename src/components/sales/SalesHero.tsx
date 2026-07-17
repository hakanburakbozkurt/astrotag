"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import { useMotionReady } from "@/hooks/useMotionReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  SALES_CTA_GIFT_CLASS,
  SALES_CTA_PRIMARY_CLASS,
  SALES_CTA_STACK_CLASS,
  SALES_JOURNEY_TAGLINE,
  SALES_MOTION_EASE,
  SALES_SECTION_CLASS,
} from "@/lib/sales/sales-motion";
import {
  LUXURY_SHOWCASE_ASPECT_RATIO,
  LUXURY_SHOWCASE_HERO_IMAGE_CLASS,
  LUXURY_SHOWCASE_IMAGE_PATH,
} from "@/lib/sales/luxury-showcase-image";
import {
  NFC_KEYCHAIN_PRODUCT,
  SALES_CTA_LABEL,
  SALES_GIFT_CTA_LABEL,
} from "@/lib/sales/star-packages-catalog";

export default function SalesHero() {
  const motionReady = useMotionReady();
  const reducedMotion = usePrefersReducedMotion();
  const canAnimate = motionReady && !reducedMotion;

  return (
    <section className={`${SALES_SECTION_CLASS} border-b border-white/[0.06]`}>
      <motion.div
        initial={canAnimate ? { opacity: 0, y: 20 } : false}
        animate={canAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={canAnimate ? { duration: 0.8, ease: SALES_MOTION_EASE } : { duration: 0 }}
        className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:grid lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-10"
      >
        <div className="order-1 w-full lg:order-none">
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#070b14] shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
            style={{ aspectRatio: LUXURY_SHOWCASE_ASPECT_RATIO }}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_28%_50%,rgba(245,158,11,0.18),transparent_70%)]"
              aria-hidden
            />
            <Image
              src={LUXURY_SHOWCASE_IMAGE_PATH}
              alt="AstroTag — on iki burçtan kişiselleştirilmiş NFC anahtarlık koleksiyonu"
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 560px"
              className={LUXURY_SHOWCASE_HERO_IMAGE_CLASS}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-gradient-to-l from-[#070b14] via-[#070b14]/85 to-transparent lg:w-[42%]"
              aria-hidden
            />
          </div>
        </div>

        <div className="order-2 flex flex-col gap-4 text-center lg:order-none lg:text-left">
          <p className="sales-kicker font-mono text-[10px] uppercase tracking-[0.38em] text-amber-400/70">
            {SALES_JOURNEY_TAGLINE}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
            {NFC_KEYCHAIN_PRODUCT.badge}
          </p>
          <h1 className="sales-title bg-gradient-to-b from-white via-amber-50 to-amber-300/90 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
            {NFC_KEYCHAIN_PRODUCT.title}
          </h1>
          <p className="sales-subtitle text-sm leading-relaxed text-white/55 sm:text-base">
            {NFC_KEYCHAIN_PRODUCT.description}
          </p>
          <p className="text-sm leading-relaxed text-white/40">
            Burç koleksiyonundan sana özel anahtarlığı seç; paketler{" "}
            <span className="font-semibold text-amber-200/90">
              {NFC_KEYCHAIN_PRODUCT.priceLabel}
            </span>
            &apos;den başlayan fiyatlarla. İstersen dijital yıldız stokunu da aynı
            yolculukta yükle.
          </p>

          <div className={`${SALES_CTA_STACK_CLASS} lg:max-w-sm`}>
            <Link
              href="#paketler"
              className={`${SALES_CTA_PRIMARY_CLASS} bg-gradient-to-r from-amber-300 to-amber-400 text-[#0f172a] shadow-[0_0_32px_rgba(251,191,36,0.25)] hover:from-amber-200 hover:to-amber-300`}
            >
              {SALES_CTA_LABEL}
            </Link>
            <Link href="#paketler" className={SALES_CTA_GIFT_CLASS}>
              <Gift className="h-4 w-4 shrink-0" aria-hidden />
              {SALES_GIFT_CTA_LABEL}
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
