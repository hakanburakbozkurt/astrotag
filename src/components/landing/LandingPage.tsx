"use client";

import Starfield from "@/components/Starfield";
import SalesNebulaBackdrop from "@/components/sales/SalesNebulaBackdrop";
import CosmicHero from "@/components/landing/CosmicHero";
import LandingNav from "@/components/landing/LandingNav";
import OraclePreviewGrid from "@/components/landing/OraclePreviewGrid";
import StarPackagesShowcase from "@/components/landing/StarPackagesShowcase";
import TrustFooter from "@/components/landing/TrustFooter";

export default function LandingPage() {
  return (
    <main className="astrotag-landing relative min-h-dvh overflow-x-hidden bg-[#030614] pb-[env(safe-area-inset-bottom,0px)] text-white">
      <Starfield variant="sales" />
      <SalesNebulaBackdrop />
      <LandingNav />

      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            "radial-gradient(ellipse 90% 50% at 50% 0%, rgba(251,191,36,0.08) 0%, transparent 55%), radial-gradient(ellipse 55% 35% at 85% 15%, rgba(99,102,241,0.07) 0%, transparent 50%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-lg flex-col">
        <CosmicHero />
        <OraclePreviewGrid />
        <StarPackagesShowcase />
        <TrustFooter />
      </div>
    </main>
  );
}
