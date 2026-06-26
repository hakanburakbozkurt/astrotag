"use client";

import { motion } from "framer-motion";

interface NexusHorizonCardProps {
  title: string;
  sign: string;
  name?: string | null;
  reading: string;
  delay?: number;
}

export default function NexusHorizonCard({
  title,
  sign,
  name,
  reading,
  delay = 0,
}: NexusHorizonCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="w-full rounded-[20px] border border-white/10 bg-[#0f172a]/80 p-4 backdrop-blur-2xl sm:p-5"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-gradient-to-b from-[#111827] to-[#070b14]">
          <span className="text-sm font-bold text-amber-100">{sign.slice(0, 3)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.22em] text-amber-400/70">
            {title}
          </p>
          {name ? (
            <p className="mt-0.5 text-[11px] text-white/40">{name}</p>
          ) : null}
          <p className="mt-1 text-sm font-semibold text-amber-100/90">{sign}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/72">{reading}</p>
        </div>
      </div>
    </motion.article>
  );
}
