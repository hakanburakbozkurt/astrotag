"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SalesMotion from "@/components/sales/SalesMotion";
import {
  LANDING_CTA_PRIMARY,
  LANDING_CTA_SECONDARY,
  LANDING_CTA_STACK,
} from "@/components/landing/landing-motion";
import { useMotionReady } from "@/hooks/useMotionReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useAuth } from "@/lib/auth";
import {
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
  DASHBOARD_PATH,
} from "@/lib/nfc/constants";
import { SALES_MOTION_EASE } from "@/lib/sales/sales-motion";

export default function CosmicHero() {
  const motionReady = useMotionReady();
  const reducedMotion = usePrefersReducedMotion();
  const canAnimate = motionReady && !reducedMotion;
  const { isAuthenticated, isLoading } = useAuth();

  const primaryHref = isAuthenticated ? DASHBOARD_PATH : AUTH_SIGNUP_PATH;
  const primaryLabel = isAuthenticated ? "Dashboard'a Git" : "Kozmik Haritana Başla";
  const secondaryHref = isAuthenticated ? DASHBOARD_PATH : AUTH_LOGIN_PATH;
  const secondaryLabel = isAuthenticated ? "Profilini Aç" : "Giriş Yap";

  return (
    <section
      className="relative flex min-h-[calc(100dvh-env(safe-area-inset-top,0px)-3.5rem)] flex-col items-center justify-center px-4 pb-10 pt-[calc(env(safe-area-inset-top,0px)+4.5rem)] sm:px-6"
      aria-label="Karşılama"
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <div className="landing-hero-ring relative h-[min(72vw,320px)] w-[min(72vw,320px)] rounded-full border border-amber-400/15 opacity-70">
          <div className="absolute inset-3 rounded-full border border-amber-400/10" />
          <div className="absolute inset-8 rounded-full border border-indigo-400/10" />
          <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.08)_0%,transparent_70%)]" />
        </div>
      </div>

      <motion.div
        initial={canAnimate ? { opacity: 0, y: 20 } : false}
        animate={canAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.85, ease: SALES_MOTION_EASE }}
        className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center text-center"
      >
        <p className="landing-kicker">Journey Beyond Earth</p>

        <h1 className="landing-serif mt-4 text-[2rem] leading-[1.12] text-white sm:text-[2.35rem]">
          Evrenin gizli haritası,
          <span className="mt-1 block text-amber-100/90">dijital rehberin</span>
        </h1>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
          Natal harita, günlük Nexus ve Oracle — saf astroloji, lüks dijital deneyim.
        </p>

        <div className={`${LANDING_CTA_STACK} max-w-xs`}>
          <Link href={primaryHref} className={LANDING_CTA_PRIMARY}>
            {isLoading ? "Yükleniyor…" : primaryLabel}
          </Link>
          <Link href={secondaryHref} className={LANDING_CTA_SECONDARY}>
            {secondaryLabel}
          </Link>
        </div>
      </motion.div>

      <SalesMotion className="relative z-10 mt-10 flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/30">Keşfet</span>
        <div className="h-8 w-px bg-gradient-to-b from-amber-400/40 to-transparent" aria-hidden />
      </SalesMotion>
    </section>
  );
}
