"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { UserData } from "@/types/user";
import RelationshipCard from "./RelationshipCard";
import SessionCounter from "./SessionCounter";
import ReferralPanel from "./ReferralPanel";
import CosmicJournal from "./CosmicJournal";
import DashboardHeader from "./DashboardHeader";

interface CosmicDashboardProps {
  user: UserData;
}

export default function CosmicDashboard({ user }: CosmicDashboardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="relative px-4 py-10 sm:px-6 sm:py-14">
        <div className="relative mx-auto max-w-2xl">
          <p className="text-center text-sm text-white/45">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-4 py-8 sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-2xl">
        <DashboardHeader userName={user.name} />

        <SessionCounter />

        <RelationshipCard user={user} />

        <ReferralPanel />

        <CosmicJournal />

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-10 text-center text-[10px] uppercase tracking-[0.25em] text-white/25"
        >
          Evrenin sırları bir dokunuş uzağınızda
        </motion.footer>
      </div>
    </div>
  );
}
