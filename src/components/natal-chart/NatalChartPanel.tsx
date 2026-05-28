"use client";

import { motion } from "framer-motion";
import type { UserData } from "@/types/user";
import NatalChart from "./NatalChart";

interface NatalChartPanelProps {
  user: UserData;
  onClose: () => void;
}

export default function NatalChartPanel({ user, onClose }: NatalChartPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/10 bg-[#0f172a]/85 p-6 backdrop-blur-2xl sm:p-8"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
          Natal Chart
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">Doğum Haritası</h2>
        <p className="mt-2 text-sm text-white/45">
          {user.birthDate} · {user.birthTime} · {user.birthPlace}
        </p>

        <div className="mt-6">
          <NatalChart userData={user} />
        </div>

        <div className="relative mt-8">
          <div
            className="pointer-events-none absolute -top-6 left-1/2 h-12 w-3/4 -translate-x-1/2 rounded-full bg-amber-400/20 blur-2xl"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={onClose}
            className="relative w-full rounded-xl border border-amber-400/30 bg-amber-400/[0.06] px-6 py-2.5 text-sm text-amber-200/90 shadow-[0_0_24px_rgba(251,191,36,0.22)] transition hover:bg-amber-400/12 hover:shadow-[0_0_32px_rgba(251,191,36,0.32)]"
          >
            Dashboard&apos;a Dön
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
