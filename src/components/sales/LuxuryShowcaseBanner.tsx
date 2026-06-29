"use client";

import Image from "next/image";
import SalesMotion from "@/components/sales/SalesMotion";
import {
  LUXURY_SHOWCASE_ASPECT_RATIO,
  LUXURY_SHOWCASE_IMAGE_PATH,
} from "@/lib/sales/luxury-showcase-image";

export default function LuxuryShowcaseBanner() {
  return (
    <div className="flex justify-center px-4 py-6 sm:px-6 sm:py-8">
      <SalesMotion className="w-full max-w-sm sm:max-w-md md:max-w-lg">
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
            sizes="(max-width: 640px) 384px, (max-width: 768px) 448px, 512px"
            className="object-contain object-center"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070b14]/10 via-transparent to-[#070b14]/75"
            aria-hidden
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-4 pt-10 sm:px-4 sm:pb-5">
            <div className="flex flex-col gap-1.5 py-2 text-center sm:gap-2 sm:py-3 lg:text-left">
              <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-amber-300/80">
                Lüks Vitrin
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-white sm:text-2xl md:text-3xl">
                AstroTag NFC Anahtarlık Koleksiyonu
              </h2>
              <p className="text-xs leading-relaxed text-white/60 sm:text-sm">
                Fiziksel zarafet, dijital kozmik erişim — her anahtarlık kişisel burç
                seçiminizle hazırlanır.
              </p>
            </div>
          </div>
        </div>
      </SalesMotion>
    </div>
  );
}
