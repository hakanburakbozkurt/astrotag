"use client";

import Link from "next/link";
import { memo } from "react";
import { motion } from "framer-motion";
import { Colors } from "@/lib/navigation/dashboard-colors";
import { DASHBOARD_HOME_MODULES } from "@/lib/navigation/dashboard-home-config";

function DashboardModuleGridInner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-2 gap-3 sm:gap-4"
      aria-label="Kozmik modüller"
    >
      {DASHBOARD_HOME_MODULES.map((module, index) => {
        const Icon = module.icon;
        return (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
          >
            <Link
              href={module.href}
              prefetch
              className={`group flex min-h-[7.5rem] flex-col items-center justify-center gap-3 px-3 py-4 text-center transition active:scale-[0.98] ${Colors.card} ${Colors.cardHover}`}
            >
              <Icon className={`${Colors.cardIcon} transition group-hover:text-stone-300`} />
              <span className={Colors.cardTitle}>{module.title}</span>
            </Link>
          </motion.div>
        );
      })}
    </motion.section>
  );
}

export default memo(DashboardModuleGridInner);
