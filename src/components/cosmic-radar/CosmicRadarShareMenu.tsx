"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import CosmicRadarShareCard from "./CosmicRadarShareCard";
import { buildCosmicRadarShareText } from "@/lib/cosmic-radar/share-content";
import type { CosmicRadarSharePayload } from "@/lib/cosmic-radar/types";

type CosmicRadarShareMenuProps = {
  payload: CosmicRadarSharePayload;
};

export default function CosmicRadarShareMenu({ payload }: CosmicRadarShareMenuProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const renderPng = useCallback(async (): Promise<Blob> => {
    const node = cardRef.current;
    if (!node) {
      throw new Error("Kart hazırlanamadı");
    }

    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0a0f1a",
    });

    const response = await fetch(dataUrl);
    return response.blob();
  }, []);

  const handleDownload = async () => {
    setIsBusy(true);
    setStatus(null);
    try {
      const blob = await renderPng();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `astrotag-kozmik-radar-${payload.sign}.png`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Görsel indirildi");
      setOpen(false);
    } catch {
      setStatus("İndirme başarısız");
    } finally {
      setIsBusy(false);
    }
  };

  const handleNativeShare = async () => {
    setIsBusy(true);
    setStatus(null);
    try {
      const blob = await renderPng();
      const file = new File([blob], "astrotag-kozmik-radar.png", {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "AstroTag Kozmik Radar",
          text: buildCosmicRadarShareText(payload),
          files: [file],
        });
        setStatus("Paylaşım menüsü açıldı");
        setOpen(false);
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: "AstroTag Kozmik Radar",
          text: buildCosmicRadarShareText(payload),
        });
        setStatus("Paylaşım menüsü açıldı");
        setOpen(false);
        return;
      }

      setStatus("Cihaz paylaşımını desteklemiyor — indirin");
    } catch {
      setStatus("Paylaşım iptal edildi veya başarısız");
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyText = async () => {
    setStatus(null);
    try {
      await navigator.clipboard.writeText(buildCosmicRadarShareText(payload));
      setStatus("Metin panoya kopyalandı");
      setOpen(false);
    } catch {
      setStatus("Metin kopyalanamadı");
    }
  };

  return (
    <div className="relative shrink-0">
      <div
        className="pointer-events-none fixed -left-[9999px] top-0 opacity-0"
        aria-hidden
      >
        <CosmicRadarShareCard ref={cardRef} payload={payload} />
      </div>

      <button
        type="button"
        aria-label="Paylaş"
        disabled={isBusy}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-amber-400/30 hover:text-amber-100 disabled:opacity-50"
      >
        <Share2 className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <button
              type="button"
              aria-label="Menüyü kapat"
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/95 p-2 shadow-xl backdrop-blur-xl"
            >
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void handleNativeShare()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-white/80 hover:bg-white/[0.06] disabled:opacity-50"
              >
                <Share2 className="h-3.5 w-3.5 text-amber-300/80" />
                Paylaş
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void handleDownload()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-white/80 hover:bg-white/[0.06] disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5 text-amber-300/80" />
                Görseli İndir
              </button>
              <button
                type="button"
                onClick={() => void handleCopyText()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-white/80 hover:bg-white/[0.06]"
              >
                <Copy className="h-3.5 w-3.5 text-amber-300/80" />
                Metni Kopyala
              </button>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {status ? (
        <p className="absolute right-0 top-full z-30 mt-1 w-40 text-right text-[9px] text-amber-300/70">
          {status}
        </p>
      ) : null}
    </div>
  );
}
