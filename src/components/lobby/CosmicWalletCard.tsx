"use client";

import Link from"next/link";
import { motion } from"framer-motion";
import { useQuery } from "@/hooks/useQuery";
import { useStarEconomy } from "@/hooks/useStarEconomy";
import { getWalletBalancesAction } from "@/lib/actions/wallet";
import { sunSignFromBirthDate } from "@/lib/astrology/sun-sign";
import { SWR_KEYS } from "@/lib/auth/data-cache";
import { AUTH_LOGIN_PATH } from "@/lib/nfc/constants";
import type { UserData } from "@/types/user";

interface CosmicWalletCardProps {
 user: UserData | null | undefined;
 isAuthenticated: boolean;
}

function formatBalance(value: number): string {
 return value.toLocaleString("tr-TR");
}

function initialsFromName(name: string | undefined): string {
 if (!name?.trim()) {
 return"?";
 }

 const parts = name.trim().split(/\s+/).filter(Boolean);
 if (parts.length === 1) {
 return parts[0]!.slice(0, 2).toLocaleUpperCase("tr-TR");
 }

 return `${parts[0]![0] ??""}${parts[parts.length - 1]![0] ??""}`.toLocaleUpperCase("tr-TR");
}

function resolveExplorerTitle(user: UserData | null | undefined): string {
 const sunSign = user?.birthDate ? sunSignFromBirthDate(user.birthDate) : null;
 return sunSign ? `${sunSign} Kaşifi` :"Kozmik Kaşif";
}

function AuthenticatedBalances() {
 const { totalStarPoints, isLoading: starsLoading } = useStarEconomy();
 const { data: wallet } = useQuery(SWR_KEYS.wallet, getWalletBalancesAction);
 const crystalBalance = wallet?.crystalBalance ?? 0;

 return (
 <div className="space-y-1.5">
 <p className="font-mono text-sm font-semibold text-stone-300">
 {wallet === undefined ?"…" : formatBalance(crystalBalance)}{""}
 <span aria-hidden>💎</span>
 </p>
 <p className="font-mono text-sm font-semibold text-zinc-400">
 {starsLoading ?"…" : formatBalance(totalStarPoints)}{""}
 <span aria-hidden>✨</span>
 </p>
 <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">
 Kristal · Yıldız Tozu
 </p>
 </div>
 );
}

export default function CosmicWalletCard({
 user,
 isAuthenticated,
}: CosmicWalletCardProps) {
 const displayName = user?.name?.trim() ||"Gezgin";
 const title = resolveExplorerTitle(user);

 return (
 <motion.section
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
 className="relative overflow-hidden rounded-none border border-white/12 bg-[#09090b] from-[#121a33]/92 via-[#0f1428]/88 to-[#1a1030]/90 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.45)] sm:p-5"
 >
 <div
 className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-zinc-900 blur-3xl"
 aria-hidden
 />
 <div
 className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-zinc-900/40 blur-3xl"
 aria-hidden
 />

 <div className="relative flex items-start justify-between gap-4">
 <div className="min-w-0">
 <div className="flex items-center gap-3">
 <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-zinc-800 bg-[#09090b] from-zinc-900 to-zinc-900 text-sm font-semibold text-zinc-400">
 {initialsFromName(user?.name)}
 </span>

 <div className="min-w-0">
 <p className="truncate text-base font-semibold text-white/95">{displayName}</p>
 <span className="mt-1 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
 {title}
 </span>
 </div>
 </div>
 </div>

 <div className="shrink-0 text-right">
 {!isAuthenticated ? (
 <Link
 href={AUTH_LOGIN_PATH}
 className="inline-flex min-h-10 items-center rounded-sm border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-stone-300 transition hover:bg-zinc-900"
 >
 Giriş Yap
 </Link>
 ) : (
 <AuthenticatedBalances />
 )}
 </div>
 </div>
 </motion.section>
 );
}
