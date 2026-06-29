"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  LUXURY_SHOWCASE_ASPECT_RATIO,
  LUXURY_SHOWCASE_IMAGE_PATH,
} from "@/lib/sales/luxury-showcase-image";

export default function LuxuryShowcaseBanner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden"
    >
      <div
        className="relative w-full bg-[#070b14]"
        style={{ aspectRatio: String(LUXURY_SHOWCASE_ASPECT_RATIO) }}
      >
        <Image
          src={LUXURY_SHOWCASE_IMAGE_PATH}
          alt="AstroTag lüks NFC anahtarlık vitrini"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-contain object-center"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070b14]/10 via-transparent to-[#070b14]/75"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-6 pt-12 sm:px-6 sm:pb-8">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-amber-300/80">
              Lüks Vitrin
            </p>
            <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              AstroTag NFC Anahtarlık Koleksiyonu
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Fiziksel zarafet, dijital kozmik erişim — her anahtarlık kişisel burç
              seçiminizle hazırlanır.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
