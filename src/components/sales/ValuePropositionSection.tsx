"use client";

import Link from "next/link";
import { Gift, Sparkles, Users } from "lucide-react";
import SalesMotion from "@/components/sales/SalesMotion";
import { VALUE_STEPS } from "@/lib/sales/landing-nav";
import { SALES_SECTION_CLASS } from "@/lib/sales/sales-motion";

const STEP_ICONS = {
  stars: Sparkles,
  gift: Gift,
  expert: Users,
} as const;

export default function ValuePropositionSection() {
  return (
    <section className={`${SALES_SECTION_CLASS} border-b border-white/[0.06]`}>
      <div className="mx-auto max-w-5xl">
        <p className="sales-kicker text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
          Yıldız Ekonomisi
        </p>
        <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
          Değer Önerisi — 3 Adımda
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Kozmik enerjini yönet, sevdiklerinle paylaş ve ihtiyaç duyduğunda uzman desteği al.
        </p>

        <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-3">
          {VALUE_STEPS.map((step, index) => {
            const Icon = STEP_ICONS[step.icon];
            return (
              <li key={step.id}>
                <SalesMotion transition={{ delay: index * 0.06 }}>
                  <Link
                    href={step.href}
                    className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f172a]/70 to-[#070b14]/80 p-5 shadow-lg backdrop-blur-xl transition hover:border-amber-400/25"
                  >
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 font-mono text-xs font-bold text-amber-200">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon className="mb-3 h-6 w-6 text-amber-400/85" aria-hidden />
                    <h3 className="text-base font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">
                      {step.description}
                    </p>
                    <span className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                      Keşfet →
                    </span>
                  </Link>
                </SalesMotion>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
