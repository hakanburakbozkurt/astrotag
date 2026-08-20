"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import {
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
} from "@/components/auth/auth-field-styles";
import { LANDING_NAV_ITEMS } from "@/components/landing/landing-nav";
import {
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
  DASHBOARD_PATH,
} from "@/lib/nfc/constants";
import { useAuth } from "@/lib/auth";

function resolveNavPrimaryHref(isAuthenticated: boolean): string {
  return isAuthenticated ? DASHBOARD_PATH : AUTH_LOGIN_PATH;
}

function resolveNavPrimaryLabel(isAuthenticated: boolean): string {
  return isAuthenticated ? "Dashboard'a Git" : "Giriş Yap";
}

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
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
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#030614]/88 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="landing-serif text-xl font-light tracking-wide text-amber-100/95"
          >
            AstroTag
          </Link>

          <button
            type="button"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-white/[0.04] text-white/80 transition hover:border-amber-400/35 hover:text-amber-100"
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
              className="fixed inset-0 z-40 bg-[#030614]/80 backdrop-blur-sm"
              onClick={close}
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,320px)] flex-col border-l border-white/10 bg-[#0a1020]/98 shadow-2xl"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
              aria-label="Ana menü"
            >
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
                <p className="landing-kicker">Menü</p>
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={close}
                  className="rounded-lg p-2 text-white/50 hover:bg-white/[0.05] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2 border-b border-white/8 p-4">
                {isAuthenticated ? (
                  <>
                    <Link
                      href={DASHBOARD_PATH}
                      onClick={close}
                      className={authPrimaryButtonClassName}
                    >
                      {resolveNavPrimaryLabel(true)}
                    </Link>
                    <Link
                      href={DASHBOARD_PATH}
                      onClick={close}
                      className={authSecondaryButtonClassName}
                    >
                      Profilini Aç
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={resolveNavPrimaryHref(false)}
                      onClick={close}
                      className={authPrimaryButtonClassName}
                    >
                      {resolveNavPrimaryLabel(false)}
                    </Link>
                    <Link
                      href={AUTH_SIGNUP_PATH}
                      onClick={close}
                      className={authSecondaryButtonClassName}
                    >
                      Kayıt Ol
                    </Link>
                  </>
                )}
              </div>

              <ul
                className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
                style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
              >
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
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>

      {!isLoading && isAuthenticated ? (
        <span className="sr-only">Oturum açık</span>
      ) : null}
    </>
  );
}
