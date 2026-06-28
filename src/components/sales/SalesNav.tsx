"use client";

import Link from "next/link";
import {
  SALES_EXPERT_LOGIN_PATH,
  SALES_ORDERS_PATH,
} from "@/lib/sales/star-packages-catalog";

export default function SalesNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-[#070b14]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-white/90 transition hover:text-amber-100"
        >
          AstroTag
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Satış menüsü">
          <Link
            href={SALES_ORDERS_PATH}
            className="rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/[0.04] hover:text-white/85"
          >
            Siparişlerim
          </Link>
          <Link
            href={SALES_EXPERT_LOGIN_PATH}
            className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80 transition hover:border-amber-400/30 hover:text-amber-100"
          >
            Giriş Yap
          </Link>
        </nav>
      </div>
    </header>
  );
}
