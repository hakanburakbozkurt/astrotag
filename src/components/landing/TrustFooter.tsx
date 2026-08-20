"use client";

import { Shield, Sparkles, Telescope } from "lucide-react";
import SalesMotion from "@/components/sales/SalesMotion";
import { GlassCard, LandingSection } from "@/components/landing/landing-primitives";
import { TRUST_ITEMS } from "@/components/landing/landing-nav";
import { SITE_HOST } from "@/lib/nfc/constants";

const TRUST_ICONS = {
  privacy: Shield,
  ephemeris: Telescope,
  turkish: Sparkles,
} as const;

export default function TrustFooter() {
  return (
    <>
      <LandingSection id="guven" bordered>
        <SalesMotion>
          <p className="landing-kicker text-center">Güven</p>
          <h2 className="landing-serif mt-2 text-center text-2xl text-white sm:text-3xl">
            Kozmik rehberliğe güvenle adım at
          </h2>
        </SalesMotion>

        <div className="mt-8 flex flex-col gap-3">
          {TRUST_ITEMS.map((item, index) => {
            const Icon = TRUST_ICONS[item.id as keyof typeof TRUST_ICONS] ?? Shield;

            return (
              <SalesMotion key={item.id} transition={{ delay: index * 0.05 }}>
                <GlassCard className="flex items-start gap-3 py-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.06] text-amber-200/80">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/48">
                      {item.description}
                    </p>
                  </div>
                </GlassCard>
              </SalesMotion>
            );
          })}
        </div>
      </LandingSection>

      <footer
        id="destek"
        className="border-t border-white/8 px-4 py-10 text-center sm:px-6"
        style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <p className="landing-kicker">Destek</p>
        <p className="mt-2 text-sm text-white/50">
          Soruların için{" "}
          <a
            href="mailto:destek@astrotag.app"
            className="font-medium text-amber-200/90 underline-offset-2 hover:underline"
          >
            destek@astrotag.app
          </a>
        </p>
        <p className="landing-serif mt-6 text-lg text-white/35">astrotag.app</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
          {SITE_HOST} · Journey Beyond Earth
        </p>
      </footer>
    </>
  );
}
