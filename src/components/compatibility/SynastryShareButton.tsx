"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Copy, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import SynastryShareCard, {
  type SynastryShareCardData,
} from "@/components/compatibility/SynastryShareCard";

type SynastryShareButtonProps = {
  data: SynastryShareCardData;
};

export default function SynastryShareButton({ data }: SynastryShareButtonProps) {
  const cardRef = useRef<HTMLDivElement>(null);
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
      link.download = `astrotag-synastry-${data.date}.png`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Görsel indirildi");
    } catch {
      setStatus("İndirme başarısız");
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopy = async () => {
    setIsBusy(true);
    setStatus(null);
    try {
      const blob = await renderPng();
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        setStatus("Panoya kopya desteklenmiyor — indirin");
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setStatus("Görsel panoya kopyalandı");
    } catch {
      setStatus("Kopyalama başarısız — indirmeyi deneyin");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="mt-4">
      <div
        className="pointer-events-none fixed -left-[9999px] top-0 opacity-0"
        aria-hidden
      >
        <SynastryShareCard ref={cardRef} data={data} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void handleDownload()}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white/75 transition hover:border-amber-400/30 hover:text-amber-100 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          İndir
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void handleCopy()}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white/75 transition hover:border-amber-400/30 hover:text-amber-100 disabled:opacity-50"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Panoya Kopyala
        </button>
      </div>

      {status ? (
        <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-amber-300/70">
          <Share2 className="h-3 w-3" aria-hidden />
          {status}
        </p>
      ) : null}
    </div>
  );
}
