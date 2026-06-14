"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { UserData } from "@/types/user";
import ModuleCard from "@/components/dashboard/ModuleCard";
import AITarotPanel from "@/components/dashboard/AITarotPanel";
import NatalChartPanel from "@/components/natal-chart/NatalChartPanel";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import {
  DASHBOARD_MODULES,
  type DashboardModule,
  type ModuleId,
} from "@/components/dashboard/modules/config";

interface OracleHubProps {
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0f172a]/90 p-6 backdrop-blur-2xl sm:rounded-[28px] sm:p-8"
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
          className="mt-6 w-full rounded-xl border border-amber-400/25 px-6 py-2.5 text-sm text-amber-200/90 hover:bg-amber-400/10"
        >
          Kapat
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function OracleHub({ user }: OracleHubProps) {
  const searchParams = useSearchParams();
  const openModuleId = searchParams.get("module") as ModuleId | null;
  const { safePush, isRouterReady } = useSafeRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeModule, setActiveModule] = useState<DashboardModule | null>(null);

  useEffect(() => {
    if (!openModuleId) {
      return;
    }

    const module = DASHBOARD_MODULES.find((item) => item.id === openModuleId);
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
      <TabPageScaffold
        eyebrow="Cosmic Oracle"
        title="Kozmik Kehanet Merkezi"
        description="Doğum haritanız, anlık sorularınız ve tarot vizyonunuz tek merkezde."
      >
        <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-4 backdrop-blur-2xl sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
            Modüller
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {DASHBOARD_MODULES.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                onSelect={handleModuleSelect}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-amber-400/15 bg-amber-400/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/60">
            Nasıl Çalışır?
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/55">
            <li>Doğum haritanız natal verilerinize göre hesaplanır.</li>
            <li>Horary, sorunuzun sorulduğu ana göre yanıt üretir.</li>
            <li>AI Tarot, sezgisel kart yorumları sunar.</li>
          </ul>
        </section>
      </TabPageScaffold>

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
    </>
  );
}
