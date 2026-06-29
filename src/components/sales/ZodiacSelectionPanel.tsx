"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ZODIAC_SIGN_OPTIONS } from "@/lib/sales/star-packages-catalog";

interface ZodiacSelectionPanelProps {
  quantity: number;
  values: string[];
  onChange: (index: number, sign: string) => void;
}

export default function ZodiacSelectionPanel({
  quantity,
  values,
  onChange,
}: ZodiacSelectionPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: "auto", marginTop: 16 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-white/10 bg-[#0a1020]/90 p-4 backdrop-blur-xl sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300/75">
          Burç Seçimi
        </p>
        <p className="mt-1 text-xs text-white/45">
          Her anahtarlık için burç tercihinizi belirleyin.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: quantity }, (_, index) => (
            <label key={index} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-white/55">
                Anahtarlık {index + 1}
              </span>
              <select
                value={values[index] ?? ""}
                onChange={(event) => onChange(index, event.target.value)}
                className="min-h-11 rounded-xl border border-white/12 bg-[#070b14]/80 px-3 text-sm text-white outline-none transition focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/15"
              >
                <option value="" disabled>
                  Burç seçin
                </option>
                {ZODIAC_SIGN_OPTIONS.map((sign) => (
                  <option key={sign} value={sign} className="bg-[#0f172a]">
                    {sign}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
