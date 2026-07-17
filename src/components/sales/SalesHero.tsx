"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useMotionReady } from "@/hooks/useMotionReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { LANDING_HERO_SLOGAN } from "@/lib/sales/landing-nav";
import {
  LUXURY_SHOWCASE_ASPECT_RATIO,
  LUXURY_SHOWCASE_HERO_IMAGE_CLASS,
  LUXURY_SHOWCASE_IMAGE_PATH,
} from "@/lib/sales/luxury-showcase-image";
import { SALES_MOTION_EASE, SALES_SECTION_CLASS } from "@/lib/sales/sales-motion";

export default function SalesHero() {
  const motionReady = useMotionReady();
  const reducedMotion = usePrefersReducedMotion();
  const canAnimate = motionReady && !reducedMotion;

  return (
    <section className={`${SALES_SECTION_CLASS} pb-6 pt-4 sm:pb-8 md:pt-6`}>
      <motion.div
        initial={canAnimate ? { opacity: 0, y: 16 } : false}
        animate={canAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7, ease: SALES_MOTION_EASE }}
        className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 text-center"
      >
        <div className="relative w-full max-w-2xl">
          <div
            className="pointer-events-none absolute -inset-3 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.2),transparent_70%)] blur-md"
            aria-hidden
          />
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-b from-[#0f172a] to-[#070b14] shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
            style={{ aspectRatio: LUXURY_SHOWCASE_ASPECT_RATIO }}
          >
            <Image
              src={LUXURY_SHOWCASE_IMAGE_PATH}
              alt="AstroTag — on iki burçtan kişiselleştirilmiş 3D NFC anahtarlık koleksiyonu"
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 672px"
              className={LUXURY_SHOWCASE_HERO_IMAGE_CLASS}
            />
          </div>
        </div>

        <div className="max-w-xl px-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-amber-400/75">
            Journey Beyond Earth
          </p>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
            {LANDING_HERO_SLOGAN}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50 sm:text-base">
            On iki burçtan biriyle kişiselleştirilmiş anahtarlık; telefonuna dokundur, kozmik
            profilin açılsın.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
