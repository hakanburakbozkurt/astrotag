"use client";

import { motion } from "framer-motion";

interface NexusSignHeaderProps {
  userSign: string;
  userName: string;
  partnerSign: string | null;
  partnerName: string | null;
}

function SignDisc({
  label,
  sign,
  name,
}: {
  label: string;
  sign: string;
  name: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-gradient-to-b from-[#111827]/95 to-[#09090b] shadow-[inset_0_0_32px_rgba(255,255,255,0.08)]">
        <span className="text-lg font-bold text-stone-300">{sign.slice(0, 3)}</span>
      </div>
      <p className="text-[9px] uppercase tracking-[0.22em] text-stone-300">{label}</p>
      <p className="truncate text-xs font-medium text-white/80">{name}</p>
      <p className="text-[11px] text-white/50">{sign}</p>
    </div>
  );
}

export default function NexusSignHeader({
  userSign,
  userName,
  partnerSign,
  partnerName,
}: NexusSignHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] border border-white/10 bg-[#0f172a]/80 p-4 backdrop-blur-2xl sm:p-5"
    >
      <p className="mb-4 text-center text-[10px] uppercase tracking-[0.28em] text-stone-300">
        Dinamik Burç Header
      </p>
      <div className="flex items-start gap-4">
        <SignDisc label="Benim Burcum" sign={userSign} name={userName} />
        <div className="mt-8 h-px w-6 shrink-0 bg-white/10" aria-hidden="true" />
        {partnerSign && partnerName ? (
          <SignDisc
            label="Partnerin Burcu"
            sign={partnerSign}
            name={partnerName}
          />
        ) : (
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-4 text-center">
            <p className="text-xs text-white/45">Partner burcu henüz yok</p>
          </div>
        )}
      </div>
    </motion.header>
  );
}
