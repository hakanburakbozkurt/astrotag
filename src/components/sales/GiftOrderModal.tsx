"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, X } from "lucide-react";
import type { GiftOrderDetails } from "@/lib/sales/star-packages-catalog";

interface GiftOrderModalProps {
  open: boolean;
  packageTitle: string;
  onClose: () => void;
  onConfirm: (details: GiftOrderDetails) => void;
}

export default function GiftOrderModal({
  open,
  packageTitle,
  onClose,
  onConfirm,
}: GiftOrderModalProps) {
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) {
      setRecipientName("");
      setNote("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ willChange: "transform" }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#070b14]/80 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ willChange: "transform" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gift-modal-title"
            className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#0f172a] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                  <Gift className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                    Hediye Siparişi
                  </p>
                  <h3 id="gift-modal-title" className="mt-1 text-lg font-semibold text-white">
                    {packageTitle}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="rounded-lg p-2 text-white/45 transition hover:bg-white/[0.05] hover:text-white/75"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-white/55">Alıcı Adı</span>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  placeholder="Kime hediye ediyorsunuz?"
                  className="min-h-11 rounded-xl border border-white/12 bg-[#070b14]/80 px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/15"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-white/55">Hediye Notu</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Kozmik bir mesaj bırakın (isteğe bağlı)"
                  className="rounded-xl border border-white/12 bg-[#070b14]/80 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/15"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 flex-1 rounded-xl border border-white/12 px-4 text-sm font-medium text-white/70 transition hover:bg-white/[0.04]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!recipientName.trim()}
                onClick={() =>
                  onConfirm({
                    recipientName: recipientName.trim(),
                    note: note.trim(),
                  })
                }
                className="min-h-11 flex-1 rounded-xl bg-emerald-400/90 px-4 text-sm font-semibold text-[#052e1a] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Hediye Olarak Gönder
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
