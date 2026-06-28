"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  markStaleActionReloadAttempt,
  reloadForStaleServerAction,
} from "@/lib/errors/stale-server-action";

interface StaleActionRecoveryProps {
  onGiveUp?: () => void;
}

export default function StaleActionRecovery({ onGiveUp }: StaleActionRecoveryProps) {
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!markStaleActionReloadAttempt()) {
      setGaveUp(true);
      onGiveUp?.();
      return;
    }

    const timer = window.setTimeout(() => {
      reloadForStaleServerAction();
    }, 600);

    return () => window.clearTimeout(timer);
  }, [onGiveUp]);

  if (gaveUp) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070b14]/95 px-6 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl border border-amber-400/20 bg-[#0f172a]/90 px-6 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          className="mx-auto h-10 w-10 rounded-full border-2 border-amber-400/25 border-t-amber-400"
          aria-hidden
        />
        <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
          Oracle Sync
        </p>
        <p className="mt-2 text-base font-medium text-white">Sistemi güncelliyoruz…</p>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          En güncel sürüme geçiliyor, lütfen bekleyin.
        </p>
      </motion.div>
    </div>
  );
}
