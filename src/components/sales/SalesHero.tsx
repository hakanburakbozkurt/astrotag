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
        className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div className="mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
          <div
            className="relative mx-auto w-full bg-[#070b14]"
            style={{ aspectRatio: String(LUXURY_SHOWCASE_ASPECT_RATIO) }}
          >
            <Image
              src={LUXURY_SHOWCASE_IMAGE_PATH}
              alt="AstroTag lüks NFC anahtarlık vitrini"
              fill
              priority
              unoptimized
              sizes="(max-width: 640px) 384px, (max-width: 1024px) 448px, 512px"
              className="object-contain object-center"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070b14]/40 via-transparent to-transparent"
              aria-hidden
            />
          </div>
        </div>

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
          <p className="sales-subtitle text-sm leading-relaxed text-white/55 sm:text-base">
            {NFC_KEYCHAIN_PRODUCT.description}
          </p>
          <p className="text-sm text-white/40">
            Paketler{" "}
            <span className="font-semibold text-amber-200/90">
              {NFC_KEYCHAIN_PRODUCT.priceLabel}
            </span>
            &apos;den başlayan fiyatlarla — burç seçiminizle kişiselleştirilmiş anahtarlık
            veya dijital yıldız stoku.
          </p>

          <div className={`${SALES_CTA_STACK_CLASS} lg:max-w-sm`}>
            <Link
              href="#paketler"
              className={`${SALES_CTA_PRIMARY_CLASS} bg-gradient-to-r from-amber-300 to-amber-400 text-[#0f172a] shadow-[0_0_32px_rgba(251,191,36,0.25)] hover:from-amber-200 hover:to-amber-300`}
            >
              {SALES_CTA_LABEL}
            </Link>
            <Link
              href="#paketler"
              className={SALES_CTA_GIFT_CLASS}
            >
              <Gift className="h-4 w-4 shrink-0" aria-hidden />
              {SALES_GIFT_CTA_LABEL}
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
