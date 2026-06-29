"use client";

import Link from "next/link";
import SalesMotion from "@/components/sales/SalesMotion";
import { SALES_MOTION_TRANSITION, SALES_SECTION_CLASS } from "@/lib/sales/sales-motion";
import { SALES_EXPERT_LOGIN_PATH } from "@/lib/sales/star-packages-catalog";

export default function ExpertJoinSection() {
  return (
    <section id="uzman-katilim" className={`${SALES_SECTION_CLASS} border-t border-white/[0.06]`}>
      <SalesMotion
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={SALES_MOTION_TRANSITION}
        className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-4 text-center sm:py-6"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
          Profesyonel Ağ
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Astrolog Kiti
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-white/50 sm:text-base">
          AstroTag uzman paneli — danışmanlık veren profesyoneller için platformun güvenilir
          yüzü. Satış vitrini değil; kariyerinizi büyüten profesyonel altyapı.
        </p>

        <Link
          href={SALES_EXPERT_LOGIN_PATH}
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-8 py-3 text-sm font-medium text-white/85 transition-[background-color,border-color,transform] duration-200 ease-out hover:border-white/25 hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
        >
          Uzman Platformuna Geç
        </Link>

        <p className="text-xs text-white/30">
          NFC profiliniz, müşteri yönlendirme ve doğrulanmış uzman rozeti.
        </p>
      </SalesMotion>
    </section>
  );
}
