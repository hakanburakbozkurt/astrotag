"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, ChevronDown, Copy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 3H21.5l-7.66 8.76L22 21h-6.59l-5.16-6.74L4.5 21H1.24l8.2-9.38L2 3h6.75l4.66 6.17L18.244 3zm-2.31 16.2h1.72L7.28 4.66H5.47l10.464 14.54z" />
    </svg>
  );
}
import {
  buildInstagramStoryText,
  buildTikTokScriptText,
  buildTwitterTweetText,
  getTwitterShareUrl,
  type TarotSharePayload,
} from "@/lib/tarot/share-content";

interface TarotShareMenuProps {
  payload: TarotSharePayload;
  onMessage?: (message: string) => void;
}

const SHARE_OPTIONS: Array<{
  id: "instagram" | "tiktok" | "twitter";
  label: string;
  sublabel: string;
  Icon: LucideIcon | typeof InstagramIcon;
  accent: string;
}> = [
  {
    id: "instagram",
    label: "Instagram",
    sublabel: "Story metni",
    Icon: InstagramIcon,
    accent: "from-pink-500/20 to-purple-600/10 border-pink-400/25",
  },
  {
    id: "tiktok",
    label: "TikTok",
    sublabel: "Video metni",
    Icon: Video,
    accent: "from-cyan-500/15 to-slate-400/10 border-cyan-300/20",
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    sublabel: "Tweet özeti",
    Icon: TwitterIcon,
    accent: "from-sky-500/15 to-slate-500/10 border-sky-400/25",
  },
];

export default function TarotShareMenu({
  payload,
  onMessage,
}: TarotShareMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notify = useCallback(
    (message: string) => {
      onMessage?.(message);
    },
    [onMessage]
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(successMessage);
      setOpen(false);
    } catch {
      notify("Panoya kopyalanamadı.");
    }
  };

  const handleShare = async (platform: (typeof SHARE_OPTIONS)[number]["id"]) => {
    if (platform === "instagram") {
      await copyText(
        buildInstagramStoryText(payload),
        "Instagram Story metni panoya kopyalandı."
      );
      return;
    }

    if (platform === "tiktok") {
      await copyText(
        buildTikTokScriptText(payload),
        "TikTok video metni panoya kopyalandı."
      );
      return;
    }

    const tweet = buildTwitterTweetText(payload);
    const url = getTwitterShareUrl(tweet);

    try {
      window.open(url, "_blank", "noopener,noreferrer");
      notify("X paylaşım penceresi açıldı.");
      setOpen(false);
    } catch {
      await copyText(tweet, "Tweet metni panoya kopyalandı.");
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/75 transition hover:border-amber-400/25 hover:bg-white/[0.06]"
      >
        <Copy className="h-4 w-4 text-amber-300/70" />
        Paylaş
        <ChevronDown
          className={`h-4 w-4 text-white/40 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/95 p-2 shadow-xl backdrop-blur-xl"
          >
            <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
              Platform seç
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SHARE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => void handleShare(option.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border bg-gradient-to-b px-2 py-3 text-center transition hover:brightness-110 ${option.accent}`}
                >
                  <option.Icon className="h-5 w-5 shrink-0 text-white/90" />
                  <span className="text-[11px] font-medium text-white/90">
                    {option.label}
                  </span>
                  <span className="text-[9px] text-white/45">{option.sublabel}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
