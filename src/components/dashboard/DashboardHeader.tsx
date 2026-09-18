"use client";

import { motion } from "framer-motion";
import CosmicAccuracyBadge from "@/components/social-proof/CosmicAccuracyBadge";

type DashboardHeaderProps = {
  userName: string;
};

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 sm:mb-7"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 text-center sm:text-left">
          <h1 className="bg-gradient-to-b from-white via-zinc-800 to-zinc-900 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            AstroTag
          </h1>
          <p className="mt-2 text-xs text-white/45">
            Hoş geldin,{" "}
            <span className="font-medium text-stone-300">{userName}</span>
          </p>
        </div>
        <CosmicAccuracyBadge variant="header" className="shrink-0" />
      </div>
    </motion.header>
  );
}
