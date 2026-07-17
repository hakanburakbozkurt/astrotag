"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { LANDING_NAV_ITEMS } from "@/lib/sales/landing-nav";

export default function SalesNav() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#070b14]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-lg"
          >
            AstroTag
          </Link>

          <button
            type="button"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] text-white/80 transition hover:border-amber-400/30 hover:text-amber-100"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Menüyü kapat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[#070b14]/75 backdrop-blur-sm"
              onClick={close}
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,320px)] flex-col border-l border-white/10 bg-[#0a1020]/98 shadow-2xl"
              aria-label="Ana menü"
            >
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
                  Menü
                </p>
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={close}
                  className="rounded-lg p-2 text-white/50 hover:bg-white/[0.05] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {LANDING_NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="block rounded-xl border border-transparent px-4 py-3.5 transition hover:border-amber-400/20 hover:bg-amber-400/[0.06]"
                    >
                      <span className="block text-sm font-semibold text-white">{item.label}</span>
                      {item.description ? (
                        <span className="mt-0.5 block text-xs leading-relaxed text-white/45">
                          {item.description}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="border-t border-white/8 p-4">
                <Link
                  href="/siparislerim"
                  onClick={close}
                  className="block rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-white/75 hover:bg-white/[0.04]"
                >
                  Siparişlerim
                </Link>
              </div>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
