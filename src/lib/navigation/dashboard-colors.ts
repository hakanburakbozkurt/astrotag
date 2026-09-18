/** Dashboard UI — monokrom noir sınıfları */

export const Colors = {
  shell: "bg-zinc-950",
  header: "border-b border-zinc-800 bg-zinc-950",
  brand: "font-[family-name:var(--font-serif-display)] text-sm tracking-[0.28em] text-white",
  card: "rounded-sm border border-zinc-800 bg-zinc-900",
  cardHover: "hover:border-zinc-600 hover:bg-zinc-900/90",
  cardTitle: "text-sm font-medium text-stone-300",
  cardIcon: "h-8 w-8 text-stone-400",
  menu: "rounded-sm border border-zinc-800 bg-zinc-900 shadow-none",
  menuItem: "flex w-full items-center px-4 py-3 text-sm text-stone-300 transition hover:bg-zinc-800",
  menuDivider: "border-t border-zinc-800",
  avatar: "rounded-full border border-zinc-700 bg-zinc-900 text-stone-300",
  balanceLabel: "text-xs text-stone-500",
  balanceValue: "font-mono text-sm text-stone-300",
  signOut:
    "w-full rounded-sm border border-zinc-700 px-4 py-2.5 text-sm font-medium text-stone-300 transition hover:border-zinc-500 hover:text-white",
} as const;
