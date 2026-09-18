/**
 * Dark Brutalism & Monochromatic Noir — AstroTag design tokens.
 */

export const NOIR_COLORS = {
  bg: "#000000",
  bgDeep: "#09090b",
  surface: "#18181b",
  panel: "#27272a",
  border: "#27272a",
  borderStrong: "#3f3f46",
  text: "#ffffff",
  beige: "#E5E0D8",
} as const;

export const noirCardClass =
  "rounded-sm border border-zinc-800 bg-zinc-900 p-3 sm:p-4";

export const noirSectionClass =
  "rounded-sm border border-zinc-800 bg-zinc-900 p-3 sm:p-4";

export const noirPrimaryButtonClass =
  "inline-flex min-h-10 w-full items-center justify-center rounded-sm border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-stone-300 transition hover:border-zinc-500 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const noirSecondaryButtonClass =
  "inline-flex min-h-10 w-full items-center justify-center rounded-sm border border-zinc-800 bg-transparent px-4 text-sm font-medium text-stone-400 transition hover:border-zinc-600 hover:text-stone-300 active:scale-[0.98] disabled:opacity-50";

/** Satır içi / header aksiyonları — w-full yok, flex sıkışmasını önler */
export const noirInlineButtonClass =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm border border-zinc-800 bg-transparent px-3 py-2 text-xs font-medium text-stone-400 transition hover:border-zinc-600 hover:text-stone-300 disabled:opacity-50";

export const noirFieldClass =
  "mt-1.5 box-border block h-10 w-full min-w-0 rounded-sm border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-zinc-600";

export const noirLabelClass = "text-xs text-stone-400";

export const noirEyebrowClass = "text-xs tracking-wide text-zinc-500";

export const noirPageClass =
  "relative mx-auto w-full max-w-xl px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-5 sm:pt-5";

export const noirDisplayTitleClass =
  "mt-1.5 font-[family-name:var(--font-serif-display)] text-xl font-normal tracking-tight text-white sm:text-2xl";

export const noirTitleClass =
  "text-base font-medium tracking-tight text-white sm:text-lg";

export const noirBodyClass = "text-sm leading-relaxed text-stone-300";

export const noirDataClass =
  "font-[family-name:var(--font-geist-mono,ui-monospace,monospace)] text-xs text-stone-300";

export const noirReadingAccent =
  "border border-zinc-700 bg-zinc-900 text-stone-300";
