"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  compactEyebrowClass,
  compactPageClass,
  compactPageTitleClass,
} from "./compact-ui";

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
    <div className={compactPageClass}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.07) 0%, transparent 70%)",
        }}
      />

      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-4"
      >
        <p className={compactEyebrowClass}>{eyebrow}</p>
        <h1 className={compactPageTitleClass}>{title}</h1>
        {description ? (
          <p className="mt-1.5 text-xs leading-relaxed text-white/45">{description}</p>
        ) : null}
        {headerExtra}
      </motion.header>

      <div className="relative space-y-4">{children}</div>
    </div>
  );
}
