'use client';

import Starfield from '@/components/Starfield';
import ExpertJoinSection from '@/components/sales/ExpertJoinSection';
import FeaturesSection from '@/components/sales/FeaturesSection';
import ProductGuideSection from '@/components/sales/ProductGuideSection';
import ProductSection from '@/components/sales/ProductSection';
import QuickAccessPanel from '@/components/sales/QuickAccessPanel';
import SalesHero from '@/components/sales/SalesHero';
import SalesNav from '@/components/sales/SalesNav';
import SalesNebulaBackdrop from '@/components/sales/SalesNebulaBackdrop';
import ValuePropositionSection from '@/components/sales/ValuePropositionSection';
import { SITE_HOST } from '@/lib/nfc/constants';

export default function SalesLanding() {
  return (
    <main className="astrotag-sales astrotag-sales-journey relative min-h-dvh overflow-x-hidden bg-[#070b14] font-sans text-white">
      <Starfield variant="sales" />
      <SalesNebulaBackdrop />
      <SalesNav />

      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 85% 55% at 50% 8%, rgba(251,191,36,0.09) 0%, transparent 58%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(99,102,241,0.08) 0%, transparent 55%)',
        }}
        aria-hidden
      />

      <div className="relative pt-14 sm:pt-16">
        <div className="mx-auto flex max-w-5xl flex-col">
          <SalesHero />
          <QuickAccessPanel />
          <ValuePropositionSection />
          <FeaturesSection />
          <ProductSection />
          <ProductGuideSection />
        </div>
      </div>

      <ExpertJoinSection />

      <footer
        id="destek"
        className="relative border-t border-white/8 px-4 py-10 text-center sm:px-6"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/60">
          Destek
        </p>
        <p className="mt-2 text-sm text-white/50">
          Soruların için{' '}
          <a
            href="mailto:destek@astrotag.app"
            className="font-medium text-amber-200/90 underline-offset-2 hover:underline"
          >
            destek@astrotag.app
          </a>
        </p>
        <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
          {SITE_HOST} · Journey Beyond Earth
        </p>
      </footer>
    </main>
  );
}
