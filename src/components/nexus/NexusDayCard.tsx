"use client";

import { motion } from "framer-motion";

interface NexusDayCardProps {
  title: string;
  sign: string;
  name?: string | null;
  reading: string;
  delay?: number;
}

export default function NexusDayCard({
  title,
  sign,
  name,
  reading,
  delay = 0,
}: NexusDayCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full max-w-[220px] flex-col items-center"
    >
      <div className="relative flex aspect-square w-full flex-col items-center justify-center rounded-full border border-amber-400/25 bg-gradient-to-b from-[#111827]/95 to-[#070b14] p-6 text-center shadow-[inset_0_0_48px_rgba(251,191,36,0.08),0_0_24px_rgba(251,191,36,0.06)]">
        <div
          className="pointer-events-none absolute inset-[10%] rounded-full border border-white/[0.06]"
          aria-hidden="true"
        />
        <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-amber-400/75">
          {title}
        </p>
        {name ? (
          <p className="mt-1 text-[10px] tracking-wide text-white/40">{name}</p>
        ) : null}
        <p className="mt-3 text-2xl font-bold tracking-tight text-amber-100">{sign}</p>
        <p className="mt-4 text-xs leading-relaxed text-white/72">{reading}</p>
      </div>
    </motion.article>
  );
}
