"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import type { UserData } from "@/types/user";
import DashboardHeader from "./DashboardHeader";
import HomeSkyStatusCard from "./HomeSkyStatusCard";
import OracleToolsSection from "./OracleToolsSection";
import RelationshipCard from "./RelationshipCard";

interface CosmicDashboardProps {
  user: UserData;
}

export default function CosmicDashboard({ user }: CosmicDashboardProps) {
  return (
    <div className="relative px-3 py-5 sm:px-5 sm:py-7">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.05) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-2xl">
        <DashboardHeader userName={user.name} />

        <HomeSkyStatusCard user={user} />

        <Suspense fallback={null}>
          <OracleToolsSection user={user} />
        </Suspense>

        <RelationshipCard user={user} />

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-7 text-center text-[9px] uppercase tracking-[0.22em] text-white/22"
        >
          Evrenin sırları bir dokunuş uzağınızda
        </motion.footer>
      </div>
    </div>
  );
}
