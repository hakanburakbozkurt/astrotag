"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import type { UserData } from "@/types/user";
import ModuleCard from "@/components/dashboard/ModuleCard";
import OracleModuleErrorBoundary from "@/components/oracle/OracleModuleErrorBoundary";
import TarotPanel from "@/components/dashboard/TarotPanel";
import CosmicProfilePanel from "@/components/dashboard/CosmicProfilePanel";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import {
  ORACLE_TOOL_MODULES,
  type DashboardModule,
  type ModuleId,
} from "@/components/dashboard/modules/config";

interface OracleToolsSectionProps {
  user: UserData;
}

export default function OracleToolsSection({ user }: OracleToolsSectionProps) {
  const searchParams = useSearchParams();
  const openModuleId = searchParams.get("module") as ModuleId | null;
  const { safePush, isRouterReady } = useSafeRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeModule, setActiveModule] = useState<DashboardModule | null>(null);

  useEffect(() => {
    if (!openModuleId) {
      return;
    }

    const module = ORACLE_TOOL_MODULES.find((item) => item.id === openModuleId);
    if (module) {
      setActiveModule(module);
    }
  }, [openModuleId]);

  const handleModuleSelect = (module: DashboardModule) => {
    if (module.href) {
      if (!isRouterReady || isNavigating) {
        return;
      }

      setIsNavigating(true);
      void safePush(module.href).finally(() => setIsNavigating(false));
      return;
    }

    setActiveModule(module);
  };

  return (
    <>
      <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-4 backdrop-blur-2xl sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
          Oracle Araçları
        </p>
        <p className="mt-1 text-sm text-white/45">
          Tarot, Horary ve Kozmik Profil — haftalık analiz Natal sekmesinde.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {ORACLE_TOOL_MODULES.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              index={index}
              onSelect={handleModuleSelect}
            />
          ))}
        </div>
      </section>

      <AnimatePresence>
        {activeModule?.id === "cosmic-profile" && (
          <OracleModuleErrorBoundary module="cosmic-profile">
            <CosmicProfilePanel user={user} onClose={() => setActiveModule(null)} />
          </OracleModuleErrorBoundary>
        )}
        {activeModule?.id === "tarot" && (
          <OracleModuleErrorBoundary module="tarot">
            <TarotPanel user={user} onClose={() => setActiveModule(null)} />
          </OracleModuleErrorBoundary>
        )}
      </AnimatePresence>
    </>
  );
}
