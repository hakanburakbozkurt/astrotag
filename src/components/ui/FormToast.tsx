"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

interface FormToastProps {
  message: string;
  variant?: "error" | "info" | "success";
  onDismiss?: () => void;
  durationMs?: number;
}

export default function FormToast({
  message,
  variant = "error",
  onDismiss,
  durationMs = 8000,
}: FormToastProps) {
  useEffect(() => {
    if (!onDismiss) {
      return;
    }

    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, message, onDismiss]);

  const styles =
    variant === "success"
      ? "border-emerald-400/30 bg-emerald-950/50 text-emerald-100"
      : variant === "info"
        ? "border-amber-400/30 bg-amber-950/40 text-amber-100"
        : "border-red-400/30 bg-red-950/45 text-red-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed backdrop-blur-md ${styles}`}
    >
      {message}
    </motion.div>
  );
}
