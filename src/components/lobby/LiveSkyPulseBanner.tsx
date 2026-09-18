"use client";

import { motion } from"framer-motion";
import { Orbit } from"lucide-react";
import type { LiveSkyPulse } from "@/components/lobby/use-live-sky-pulse";

interface LiveSkyPulseBannerProps {
 pulse: LiveSkyPulse;
}

export default function LiveSkyPulseBanner({ pulse }: LiveSkyPulseBannerProps) {
 return (
 <motion.section
 initial={{ opacity: 0, y: -8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
 className="relative overflow-hidden rounded-sm border border-zinc-700 bg-[#09090b] from-indigo-950/70 via-zinc-800 to-indigo-950/70 px-4 py-3.5"
 >
 <div
 className="pointer-events-none absolute inset-0 opacity-60"
 aria-hidden
 style={{
 background:"radial-gradient(circle at 12% 50%, rgba(34,211,238,0.18) 0%, transparent 42%), radial-gradient(circle at 88% 40%, rgba(167,139,250,0.16) 0%, transparent 40%)",
 }}
 />

 <div className="relative flex items-center gap-3">
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-900 text-stone-300">
 <Orbit className="h-5 w-5 animate-[spin_12s_linear_infinite]" aria-hidden />
 </span>

 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-medium tracking-wide text-stone-300">
 {pulse.moonLine}
 </p>
 <p
 className={`mt-0.5 truncate text-xs ${
 pulse.flowLine.includes("Yüksek")
 ?"text-stone-300"
 :"text-zinc-500"
 }`}
 >
 {pulse.isLoading ?"Kozmik Nabız Taranıyor…" : pulse.flowLine}
 </p>
 </div>

 <span
 className="hidden shrink-0 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] text-zinc-300 sm:inline"
 aria-hidden
 >
 Canlı
 </span>
 </div>
 </motion.section>
 );
}
