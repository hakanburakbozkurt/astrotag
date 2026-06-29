"use client";

import { motion } from "framer-motion";
import { NFC_KEYCHAIN_PRODUCT } from "@/lib/sales/star-packages-catalog";

export default function SalesHero() {
  return (
    <section className="relative pb-10 sm:pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-5xl px-4 pt-8 text-center sm:px-6 lg:text-left"
      >
        <p className="sales-kicker font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/70">
          {NFC_KEYCHAIN_PRODUCT.badge}
        </p>
        <h1 className="sales-title mx-auto mt-3 max-w-3xl bg-gradient-to-b from-white via-amber-50 to-amber-300/90 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:mx-0 lg:text-5xl">
          {NFC_KEYCHAIN_PRODUCT.title}
        </h1>
        <p className="sales-subtitle mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base lg:mx-0">
          {NFC_KEYCHAIN_PRODUCT.description}
        </p>
        <p className="mt-5 text-sm text-white/40">
          Paketler{" "}
          <span className="font-semibold text-amber-200/90">{NFC_KEYCHAIN_PRODUCT.priceLabel}</span>
          &apos;den başlayan fiyatlarla — aşağıdan seçim yapın.
        </p>
      </motion.div>
    </section>
  );
}
