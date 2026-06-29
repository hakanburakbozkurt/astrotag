"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SALES_EXPERT_LOGIN_PATH } from "@/lib/sales/star-packages-catalog";

export default function ExpertJoinSection() {
  return (
    <section
      id="uzman-katilim"
      className="border-t border-white/[0.06] px-4 py-16 sm:px-6 sm:py-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
          Profesyonel Ağ
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Astrolog Kiti
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/50 sm:text-base">
          AstroTag uzman paneli — danışmanlık veren profesyoneller için platformun güvenilir
          yüzü. Satış vitrini değil; kariyerinizi büyüten profesyonel altyapı.
        </p>

        <Link
          href={SALES_EXPERT_LOGIN_PATH}
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-8 py-3 text-sm font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
        >
          Uzman Platformuna Geç
        </Link>

        <p className="mt-4 text-xs text-white/30">
          NFC profiliniz, müşteri yönlendirme ve doğrulanmış uzman rozeti.
        </p>
      </motion.div>
    </section>
  );
}
