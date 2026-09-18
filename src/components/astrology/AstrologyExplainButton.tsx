"use client";

import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface AstrologyExplainButtonProps {
  explanation: string;
  label?: string;
}

function AstrologyExplainButtonInner({
  explanation,
  label = "Bu uyarının anlamı",
}: AstrologyExplainButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [close, open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-950 text-xs text-stone-400 transition hover:border-zinc-500 hover:text-stone-300"
      >
        ?
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            aria-label={label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-[calc(100%+6px)] z-30 w-[min(18rem,calc(100vw-2rem))] rounded-sm border border-zinc-800 bg-zinc-900 p-3 text-xs leading-relaxed text-stone-400 shadow-none sm:left-auto sm:right-0"
          >
            {explanation}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default memo(AstrologyExplainButtonInner);
