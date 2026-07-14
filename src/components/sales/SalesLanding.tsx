'use client';

import Starfield from '@/components/Starfield';
import ExpertJoinSection from '@/components/sales/ExpertJoinSection';
import ProductGuideSection from '@/components/sales/ProductGuideSection';
import ProductSection from '@/components/sales/ProductSection';
import SalesHero from '@/components/sales/SalesHero';
import SalesNav from '@/components/sales/SalesNav';
import SalesNebulaBackdrop from '@/components/sales/SalesNebulaBackdrop';
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
            'radial-gradient(ellipse 85% 55% at 50% 12%, rgba(251,191,36,0.08) 0%, transparent 62%)',
        }}
        aria-hidden
      />

      <div className="relative pt-14 sm:pt-16">
        <div className="mx-auto flex max-w-5xl flex-col">
          <SalesHero />
          <ProductSection />
          <ProductGuideSection />
        </div>
      </div>

      <ExpertJoinSection />

      <footer className="relative border-t border-white/8 px-4 py-8 text-center sm:px-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
          {SITE_HOST} · Journey Beyond Earth
        </p>
      </footer>
    </main>
  );
}
