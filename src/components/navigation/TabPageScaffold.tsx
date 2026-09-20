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
  topNav?: ReactNode;
  /** ModulePageShell içinde — dış padding/max-width tekrarlanmasın */
  embedded?: boolean;
  /** Başlık bloğunu gizle (feed / story odaklı sayfalar) */
  hideHeader?: boolean;
}

export default function TabPageScaffold({
  eyebrow,
  title,
  description,
  children,
  headerExtra,
  topNav,
  embedded = false,
  hideHeader = false,
}: TabPageScaffoldProps) {
  return (
    <div className={embedded ? "relative w-full min-w-0" : compactPageClass}>
      {topNav ? <div className="mb-4">{topNav}</div> : null}
      {!hideHeader ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}
        />
      ) : null}

      {!hideHeader ? (
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
      ) : null}

      <div className="relative space-y-4">{children}</div>
    </div>
  );
}
