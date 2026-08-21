"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LegalMarkdownContent from "@/components/legal/LegalMarkdownContent";
import type { LegalDocumentSlug } from "@/lib/legal/legal-document-slugs";

type LegalDocumentModalProps = {
  slug: LegalDocumentSlug | null;
  onClose: () => void;
};

type LegalDocumentResponse = {
  title: string;
  markdown: string;
};

export default function LegalDocumentModal({ slug, onClose }: LegalDocumentModalProps) {
  const [document, setDocument] = useState<LegalDocumentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setDocument(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/legal/${slug}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Belge yüklenemedi.");
        }

        const payload = (await response.json()) as LegalDocumentResponse;
        setDocument(payload);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }
        setDocument(null);
        setError(
          fetchError instanceof Error ? fetchError.message : "Belge yüklenemedi."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [slug, onClose]);

  return (
    <AnimatePresence>
      {slug ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-document-title"
            className="flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-[20px] border border-violet-400/25 bg-[#0b1220] shadow-2xl"
          >
            <header className="shrink-0 border-b border-white/10 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-violet-300/70">
                Yasal Metin
              </p>
              <h2
                id="legal-document-title"
                className="mt-1 text-base font-semibold leading-snug text-white/95"
              >
                {document?.title ?? "Yükleniyor…"}
              </h2>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <p className="text-sm text-white/45">Metin yükleniyor…</p>
              ) : error ? (
                <p className="text-sm text-red-300/85">{error}</p>
              ) : document ? (
                <LegalMarkdownContent markdown={document.markdown} />
              ) : null}
            </div>

            <footer className="shrink-0 border-t border-white/10 p-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-violet-500/20 py-3 text-xs font-medium uppercase tracking-[0.2em] text-violet-100 transition hover:bg-violet-500/30"
              >
                Kapat
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
