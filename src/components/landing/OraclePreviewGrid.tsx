"use client";

import { Moon, Sparkles, SunMedium } from "lucide-react";
import SalesMotion from "@/components/sales/SalesMotion";
import { GlassCard, LandingSection, SectionHeader } from "@/components/landing/landing-primitives";
import { ORACLE_FEATURE_CARDS } from "@/components/landing/landing-nav";

const FEATURE_ICONS = {
  natal: Moon,
  nexus: SunMedium,
  oracle: Sparkles,
} as const;

export default function OraclePreviewGrid() {
  return (
    <LandingSection id="ozellikler" bordered>
      <SectionHeader
        kicker="Kozmik Hizmetler"
        title="Oracle deneyiminin kalbi"
        subtitle="Natal haritandan günlük rehbere — her modül tek bir kozmik asistanın parçası."
      />

      <div className="mt-8 flex flex-col gap-4">
        {ORACLE_FEATURE_CARDS.map((feature, index) => {
          const Icon = FEATURE_ICONS[feature.id as keyof typeof FEATURE_ICONS] ?? Sparkles;

          return (
            <SalesMotion key={feature.id} transition={{ delay: index * 0.06 }}>
              <GlassCard className="flex gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] text-amber-200/90">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="landing-serif text-xl text-white">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/52">
                    {feature.description}
                  </p>
                </div>
              </GlassCard>
            </SalesMotion>
          );
        })}
      </div>
    </LandingSection>
  );
}
