"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface TabPageScaffoldProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  headerExtra?: ReactNode;
}

export default function TabPageScaffold({
  eyebrow,
  title,
  description,
  children,
  headerExtra,
}: TabPageScaffoldProps) {
  return (
    <div className="relative mx-auto w-full max-w-xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.08) 0%, transparent 70%)",
        }}
      />

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-6"
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-amber-400/70">
          {eyebrow}
        </p>
        <h1 className="mt-2 bg-gradient-to-b from-white to-amber-200/80 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-white/45">{description}</p>
        ) : null}
        {headerExtra}
      </motion.header>

      <div className="relative space-y-5">{children}</div>
    </div>
  );
}
