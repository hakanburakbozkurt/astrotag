"use client";

import { Heart, Moon, Sparkles } from "lucide-react";
import SalesMotion from "@/components/sales/SalesMotion";
import { FEATURE_CARDS } from "@/lib/sales/landing-nav";
import { SALES_SECTION_CLASS } from "@/lib/sales/sales-motion";

const FEATURE_ICONS = {
  natal: Moon,
  synastry: Heart,
  tarot: Sparkles,
} as const;

export default function FeaturesSection() {
  return (
    <section id="ozellikler" className={`${SALES_SECTION_CLASS} border-b border-white/[0.06]`}>
      <div className="mx-auto max-w-5xl">
        <p className="sales-kicker text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
          Kozmik Hizmetler
        </p>
        <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
          Natal, Sinastri ve Tarot
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Giriş yapmadan bile ne sunduğumuzu gör; her modül tek bir kozmik asistan deneyiminin
          parçası.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {FEATURE_CARDS.map((feature, index) => {
            const Icon = FEATURE_ICONS[feature.id as keyof typeof FEATURE_ICONS] ?? Sparkles;
            return (
              <SalesMotion key={feature.id} transition={{ delay: index * 0.05 }}>
                <article className="flex h-full flex-col rounded-2xl border border-indigo-400/15 bg-gradient-to-br from-[#0f172a]/80 via-[#0a1020]/90 to-[#070b14]/95 p-5 shadow-lg backdrop-blur-xl">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-200">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/52">{feature.description}</p>
                </article>
              </SalesMotion>
            );
          })}
        </div>
      </div>
    </section>
  );
}
