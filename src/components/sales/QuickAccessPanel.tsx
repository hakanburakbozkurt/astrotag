"use client";

import Link from "next/link";
import { KeyRound, Nfc, Search, UserCog } from "lucide-react";
import SalesMotion from "@/components/sales/SalesMotion";
import { QUICK_ACCESS_ITEMS } from "@/lib/sales/landing-nav";
import { SALES_SECTION_CLASS } from "@/lib/sales/sales-motion";

const ICONS = {
  nfc: Nfc,
  code: KeyRound,
  guest: Search,
  expert: UserCog,
} as const;

export default function QuickAccessPanel() {
  return (
    <section className={`${SALES_SECTION_CLASS} border-b border-white/[0.06] py-8`}>
      <div className="mx-auto max-w-5xl">
        <p className="sales-kicker text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
          Hızlı Giriş
        </p>
        <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">Nereden Başlamak İstersin?</h2>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
          {QUICK_ACCESS_ITEMS.map((item, index) => {
            const Icon = ICONS[item.id];
            return (
              <SalesMotion key={item.id} transition={{ delay: index * 0.05 }}>
                <Link
                  href={item.href}
                  className="flex min-h-[108px] flex-col justify-between rounded-2xl border border-white/10 bg-[#0f172a]/55 p-4 shadow-lg backdrop-blur-xl transition hover:border-amber-400/25 hover:bg-amber-400/[0.05] sm:min-h-[120px] sm:p-5"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-200">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold leading-snug text-white sm:text-base">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-white/45 sm:text-xs">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </SalesMotion>
            );
          })}
        </div>
      </div>
    </section>
  );
}
