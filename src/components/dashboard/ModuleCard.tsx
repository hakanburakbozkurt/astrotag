"use client";

import { motion } from "framer-motion";
import type { DashboardModule } from "./modules/config";
import ModuleIcon from "./ModuleIcon";

interface ModuleCardProps {
  module: DashboardModule;
  index: number;
  onSelect: (module: DashboardModule) => void;
}

export default function ModuleCard({ module, index, onSelect }: ModuleCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.15 + index * 0.1,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(module)}
      className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur-xl transition-colors hover:border-amber-400/30 hover:bg-white/[0.06] sm:p-6"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(251,191,36,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/5">
          <ModuleIcon icon={module.icon} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-amber-400/70">
            {module.subtitle}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">
            {module.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/45">
            {module.description}
          </p>
        </div>

        <span className="mt-1 text-amber-400/40 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-400/70">
          →
        </span>
      </div>
    </motion.button>
  );
}
