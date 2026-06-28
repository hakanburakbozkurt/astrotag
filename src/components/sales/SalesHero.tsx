"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  buildPurchaseSuccessUrl,
  NFC_KEYCHAIN_PRODUCT,
  SALES_CTA_LABEL,
} from "@/lib/sales/star-packages-catalog";
import { WELCOME_IMAGE_PATH } from "@/lib/nfc/constants";

export default function SalesHero() {
  const router = useRouter();

  return (
    <section className="relative px-4 pb-12 pt-24 sm:px-6 sm:pb-14 sm:pt-28">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center lg:flex-row lg:items-center lg:gap-14 lg:text-left">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative shrink-0"
        >
          <div className="sales-hero-glow absolute -inset-6 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="sales-hero-frame relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c1222] p-3 shadow-[0_0_80px_rgba(251,191,36,0.15)]">
            <Image
              src={WELCOME_IMAGE_PATH}
              alt="AstroTag NFC anahtarlık"
              width={320}
              height={320}
              priority
              className="h-auto w-[min(300px,72vw)] rounded-[1.5rem] object-contain lg:w-[320px]"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 max-w-xl lg:mt-0"
        >
          <p className="sales-kicker font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/70">
            Kozmik Satış Platformu
          </p>
          <h1 className="sales-title mt-3 bg-gradient-to-b from-white via-amber-50 to-amber-300/90 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
            {NFC_KEYCHAIN_PRODUCT.title}
          </h1>
          <p className="sales-subtitle mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
            {NFC_KEYCHAIN_PRODUCT.description}
          </p>
          <p className="mt-5 text-2xl font-semibold tabular-nums text-amber-100">
            {NFC_KEYCHAIN_PRODUCT.priceLabel}
          </p>

          <button
            type="button"
            onClick={() => router.push(buildPurchaseSuccessUrl(NFC_KEYCHAIN_PRODUCT.id))}
            className="sales-cta relative mt-8 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-400/25 to-amber-500/12 text-sm font-semibold tracking-wide text-amber-50 shadow-[0_0_32px_rgba(251,191,36,0.18)] transition hover:border-amber-400/60 hover:from-amber-400/32 hover:to-amber-500/18 lg:w-auto lg:px-10"
          >
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-400/35 bg-[#0f172a] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-200">
              {NFC_KEYCHAIN_PRODUCT.badge}
            </span>
            {SALES_CTA_LABEL}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
