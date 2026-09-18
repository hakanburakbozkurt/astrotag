"use client";

import Link from"next/link";
import { motion } from"framer-motion";
import { LOBBY_MODULE_GRID } from "@/components/lobby/lobby-config";

export default function LobbyModuleGrid() {
 return (
 <motion.section
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
 className="grid grid-cols-3 gap-x-1 gap-y-5 sm:gap-x-2 sm:gap-y-6"
 >
 {LOBBY_MODULE_GRID.map((module, index) => {
 const Icon = module.icon;

 return (
 <motion.div
 key={module.id}
 initial={{ opacity: 0, scale: 0.94 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.38, delay: 0.06 + index * 0.04 }}
 >
 <Link
 href={module.href}
 prefetch
 className="group flex flex-col items-center gap-2.5 px-1 py-1 text-center transition active:scale-[0.96]"
 >
 <span className="relative flex h-[4.75rem] w-[4.75rem] items-center justify-center sm:h-[5.25rem] sm:w-[5.25rem]">
 <span
 className="absolute inset-0 rounded-full opacity-80 blur-xl transition duration-300 group-hover:opacity-100 group-hover:blur-2xl"
 style={{
 background: `radial-gradient(circle at 50% 50%, ${module.glowFrom} 0%, ${module.glowTo} 68%, transparent 100%)`,
 }}
 aria-hidden
 />
 <span
 className="absolute inset-[18%] rounded-full bg-white/[0.04] transition duration-300 group-hover:bg-white/[0.07]"
 aria-hidden
 />
 <Icon
 className={`relative h-11 w-11 transition duration-300 group-hover:scale-105 sm:h-12 sm:w-12 ${module.iconTone}`}
 />
 </span>

 <span className="max-w-[6.5rem] text-[11px] font-medium leading-tight tracking-wide text-white/78 transition group-hover:text-white/95 sm:text-xs">
 {module.title}
 </span>
 </Link>
 </motion.div>
 );
 })}
 </motion.section>
 );
}
