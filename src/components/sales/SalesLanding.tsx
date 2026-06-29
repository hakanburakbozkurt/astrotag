"use client";

import Starfield from "@/components/Starfield";
import ExpertJoinSection from "@/components/sales/ExpertJoinSection";
import SalesHero from "@/components/sales/SalesHero";
import SalesNav from "@/components/sales/SalesNav";
import StarPackageGrid from "@/components/sales/StarPackageGrid";
import { SITE_HOST } from "@/lib/nfc/constants";

export default function SalesLanding() {
  return (
    <main className="astrotag-sales relative min-h-dvh overflow-x-hidden bg-[#070b14] text-white">
      <Starfield />
      <SalesNav />

      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(251,191,36,0.1) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="relative">
        <SalesHero />
        <StarPackageGrid />
      </div>

      <ExpertJoinSection />

      <footer className="relative border-t border-white/8 px-4 py-8 text-center sm:px-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
            {SITE_HOST} · Kozmik Satış Platformu
          </p>
        </footer>
    </main>
  );
}
