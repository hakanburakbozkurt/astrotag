"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { NatalChartViewMode } from "@/lib/astrology/types";
import type { UserData } from "@/types/user";
import NatalChart from "./NatalChart";
import NatalChartViewToggle from "./NatalChartViewToggle";

interface NatalChartPanelProps {
  user: UserData;
  onClose: () => void;
}

export default function NatalChartPanel({ user, onClose }: NatalChartPanelProps) {
  const [viewMode, setViewMode] = useState<NatalChartViewMode>("classic");

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
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#0f172a]/90 p-5 backdrop-blur-2xl sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
              Natal Chart
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Doğum Haritası</h2>
            <p className="mt-2 text-sm text-white/45">
              {user.birthDate} · {user.birthTime} · {user.birthPlace}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NatalChartViewToggle mode={viewMode} onChange={setViewMode} />
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 rounded-xl border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-white/65 transition hover:border-amber-400/25 hover:text-amber-100"
            >
              Kapat
            </button>
          </div>
        </div>

        <div className="mt-6">
          <NatalChart userData={user} viewMode={viewMode} />
        </div>
      </motion.div>
    </motion.div>
  );
}
