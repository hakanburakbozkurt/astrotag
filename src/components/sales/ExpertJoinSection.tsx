"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SALES_EXPERT_LOGIN_PATH } from "@/lib/sales/star-packages-catalog";

export default function ExpertJoinSection() {
  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 sm:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-6 backdrop-blur-2xl sm:p-8"
      >
        <p className="text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
          Uzman Ağı
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">Uzman Olarak Katıl</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
          Astroloji, tarot veya ilişki danışmanlığı veriyorsanız AstroTag uzman paneline
          katılın. NFC anahtarlık sahiplerine özel profil ve yönlendirme altyapısı.
        </p>

        <ul className="mt-5 space-y-2 text-sm text-white/50">
          <li>· Kişisel NFC profil sayfanız</li>
          <li>· Müşteri yönlendirme ve güven rozeti</li>
          <li>· Kozmik Başlangıç aktivasyon akışı</li>
        </ul>

        <Link
          href={SALES_EXPERT_LOGIN_PATH}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-amber-400/30 hover:text-amber-100"
        >
          Uzman Girişi
        </Link>
      </motion.div>
    </section>
  );
}
