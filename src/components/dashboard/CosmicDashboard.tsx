"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { UserData } from "@/types/user";
import ModuleCard from "./ModuleCard";
import RelationshipCard from "./RelationshipCard";
import SessionCounter from "./SessionCounter";
import ReferralPanel from "./ReferralPanel";
import CosmicJournal from "./CosmicJournal";
import DashboardHeader from "./DashboardHeader";
import AITarotPanel from "./AITarotPanel";
import NatalChartPanel from "../natal-chart/NatalChartPanel";
import { DASHBOARD_MODULES, type DashboardModule } from "./modules/config";

interface CosmicDashboardProps {
  user: UserData;
}

function ModulePlaceholder({
  module,
  onClose,
}: {
  module: DashboardModule;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-md rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-8 text-center backdrop-blur-2xl"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
          {module.subtitle}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">{module.title}</h2>
        <p className="mt-4 text-sm text-white/45">
          Bu modül yakında aktif olacak. Doğum verileriniz analiz için hazır.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-xl border border-amber-400/25 px-6 py-2.5 text-sm text-amber-200/90 hover:bg-amber-400/10"
        >
          Dashboard&apos;a Dön
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function CosmicDashboard({ user }: CosmicDashboardProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeModule, setActiveModule] = useState<DashboardModule | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleModuleSelect = (module: DashboardModule) => {
    if (module.href) {
      router.push(module.href);
      return;
    }

    setActiveModule(module);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative min-h-dvh overflow-y-auto px-4 py-10 sm:px-6 sm:py-14">
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

        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          {DASHBOARD_MODULES.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              index={index}
              onSelect={handleModuleSelect}
            />
          ))}
        </div>

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

      <AnimatePresence>
        {activeModule?.id === "ai-tarot" && (
          <AITarotPanel user={user} onClose={() => setActiveModule(null)} />
        )}
        {activeModule?.id === "natal-chart" && (
          <NatalChartPanel user={user} onClose={() => setActiveModule(null)} />
        )}
        {activeModule &&
          activeModule.id !== "ai-tarot" &&
          activeModule.id !== "natal-chart" &&
          activeModule.id !== "horary" && (
          <ModulePlaceholder
            module={activeModule}
            onClose={() => setActiveModule(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
