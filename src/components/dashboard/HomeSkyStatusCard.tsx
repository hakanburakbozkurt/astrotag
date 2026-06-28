"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchNexusTransitStressAction } from "@/lib/actions/nexus-transit-stress";
import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";
import { getTransitStressTextClass } from "@/lib/nexus/transit-stress-tone";
import type { UserData } from "@/types/user";

interface HomeSkyStatusCardProps {
  user: UserData;
}

export default function HomeSkyStatusCard({ user }: HomeSkyStatusCardProps) {
  const [stress, setStress] = useState<NexusTransitStress | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchNexusTransitStressAction(user);
        if (!cancelled) {
          setStress(result);
        }
      } catch {
        if (!cancelled) {
          setStress(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      className="mb-6 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:mb-8 sm:p-5"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-amber-400/70">
        Gökyüzü Durumu
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        {stress?.skySummary ?? "Transit verisi yükleniyor..."}
      </p>
      {stress ? (
        <p className={`mt-2 text-sm ${getTransitStressTextClass(stress)}`}>
          {stress.tactic}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/dashboard/nexus"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-400/10 px-5 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20"
        >
          Nexus · Günlük Akış
        </Link>
        <Link
          href="/dashboard/bonds"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/75 transition hover:border-amber-400/25"
        >
          Uyumluluk
        </Link>
      </div>
    </motion.section>
  );
}
