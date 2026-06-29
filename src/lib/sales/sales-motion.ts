import type { Transition, Variants } from "framer-motion";

export const SALES_JOURNEY_TAGLINE = "Journey Beyond Earth";

/** 48px+ dokunma hedefleri — mobil öncelikli */
export const SALES_CTA_STACK_CLASS = "mt-5 flex flex-col gap-4";

export const SALES_CTA_PRIMARY_CLASS =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-[background-color,border-color,transform,opacity] duration-200 ease-out active:scale-[0.98]";

export const SALES_CTA_GIFT_CLASS =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/80 transition-[background-color,border-color,transform,opacity] duration-200 ease-out hover:border-emerald-400/25 hover:bg-emerald-400/[0.06] hover:text-emerald-100 active:scale-[0.98]";

export const SALES_SECTION_CLASS =
  "flex flex-col py-10 px-4 sm:px-6 md:py-12 lg:py-16";

export const SALES_MOTION_LAYER_CLASS = "sales-motion-layer will-change-transform";

/** Scroll-reveal — tüm vitrin kartları ve bölümler */
export const SALES_IN_VIEW_INITIAL = { opacity: 0, y: 50 } as const;

export const SALES_IN_VIEW_VISIBLE = { opacity: 1, y: 0 } as const;

export const SALES_IN_VIEW_VIEWPORT = { once: true, amount: 0.2 } as const;

export const SALES_IN_VIEW_TRANSITION: Transition = {
  duration: 0.5,
  ease: "easeOut",
};

export const SALES_FADE_UP: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export const SALES_FADE_IN: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const SALES_MOTION_TRANSITION: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

export const SALES_MOTION_TRANSITION_FAST: Transition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
};
