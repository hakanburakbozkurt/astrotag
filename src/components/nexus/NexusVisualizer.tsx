"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchNexusTransitStressAction } from "@/lib/actions/nexus-transit-stress";
import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";
import type { UserData } from "@/types/user";

interface NexusVisualizerProps {
  userData: UserData;
}

export default function NexusVisualizer({ userData }: NexusVisualizerProps) {
  const [stress, setStress] = useState<NexusTransitStress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      try {
        const result = await fetchNexusTransitStressAction(userData);
        if (!cancelled) {
          setStress(result);
        }
      } catch {
        if (!cancelled) {
          setStress(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userData]);

  if (isLoading) {
    return (
      <div className="rounded-[20px] border border-white/10 bg-[#0f172a]/80 p-4 animate-pulse backdrop-blur-2xl sm:p-5">
        <div className="h-3 w-40 rounded-full bg-white/10" />
        <div className="mt-3 h-10 rounded-lg bg-white/[0.06]" />
      </div>
    );
  }

  if (!stress) {
    return null;
  }

  const borderClass = stress.isStressed
    ? "border-red-500/45 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
    : "border-white/10";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[20px] border bg-[#0f172a]/80 p-4 backdrop-blur-2xl sm:p-5 ${borderClass}`}
    >
      <p className="text-[10px] uppercase tracking-[0.24em] text-amber-400/70">
        Gök Yüzü Baskısı
      </p>
      <p className="mt-2 text-sm font-medium text-white/85">{stress.skySummary}</p>
      <p
        className={`mt-3 text-sm leading-relaxed ${
          stress.isStressed ? "text-red-200/90" : "text-emerald-200/80"
        }`}
      >
        {stress.tactic}
      </p>
      <p className="mt-3 font-mono text-[10px] tracking-wide text-white/35">
        Transit motoru · {stress.harshAspectCount} sert açı · seviye{" "}
        {stress.stressLevel}
      </p>
    </motion.section>
  );
}
