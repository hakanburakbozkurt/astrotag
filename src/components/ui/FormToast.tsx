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
      ? "border-zinc-700 bg-zinc-900 text-stone-300"
      : variant === "info"
        ? "border-zinc-700 bg-zinc-900 text-stone-300"
        : "border-zinc-700 bg-zinc-900 text-stone-400";

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
