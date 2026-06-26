"use client";

import { motion } from "framer-motion";

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
      <div className="min-w-0 text-center sm:text-left">
        <h1 className="bg-gradient-to-b from-white via-amber-100 to-amber-300/90 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
          AstroTag
        </h1>
        <p className="mt-2 text-xs text-white/45">
          Hoş geldin,{" "}
          <span className="font-medium text-amber-200/80">{userName}</span>
        </p>
      </div>
    </motion.header>
  );
}
