"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { WeeklyTransitRow } from "@/lib/cosmic-radar/types";
import WeeklyTransitGrid from "./WeeklyTransitGrid";

interface TransitDataAccordionProps {
  rows: WeeklyTransitRow[];
  perspectiveSign: string;
}

export default function TransitDataAccordion({
  rows,
  perspectiveSign,
}: TransitDataAccordionProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.04] sm:px-4"
      >
        <span className="text-xs font-medium text-white/85">
          Gezegen Konumları ve Teknik Veriler
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-amber-300/70 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/8"
          >
            <div className="p-2 sm:p-3">
              <WeeklyTransitGrid rows={rows} perspectiveSign={perspectiveSign} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
