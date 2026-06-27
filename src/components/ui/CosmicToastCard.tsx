"use client";

import { motion } from "framer-motion";
import type { Toast } from "react-hot-toast";
import { toast } from "react-hot-toast";

interface CosmicToastCardProps {
  toastState: Toast;
  message: string;
  icon: string;
}

export default function CosmicToastCard({ toastState, message, icon }: CosmicToastCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -18, scale: 0.94, filter: "blur(6px)" }}
      animate={{
        opacity: toastState.visible ? 1 : 0,
        y: toastState.visible ? 0 : -12,
        scale: toastState.visible ? 1 : 0.96,
        filter: toastState.visible ? "blur(0px)" : "blur(4px)",
      }}
      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.85 }}
      className="pointer-events-auto mx-auto w-[min(100vw-2rem,22rem)]"
    >
      <button
        type="button"
        onClick={() => toast.dismiss(toastState.id)}
        className="flex w-full items-start gap-3 rounded-2xl border border-white/15 bg-[#0f172a]/72 px-4 py-3.5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:border-amber-400/25 hover:bg-[#0f172a]/82"
      >
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-lg"
        >
          {icon}
        </span>
        <span className="pt-0.5 text-sm leading-relaxed text-white/90">{message}</span>
      </button>
    </motion.div>
  );
}
