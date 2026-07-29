"use client";

import { useCallback, useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import type { ManifestoPresentation } from "@/lib/manifesto/manifesto-presentation";
import {
  downloadManifestoStoryCard,
  generateManifestoStoryCard,
  shareManifestoStoryCard,
} from "@/lib/manifesto/manifesto-story-card";

interface ManifestoStoryShareProps {
  presentation: ManifestoPresentation;
  userName?: string;
  categoryLabel?: string;
  cycleLabel?: string;
}

export default function ManifestoStoryShare({
  presentation,
  userName,
  categoryLabel,
  cycleLabel,
}: ManifestoStoryShareProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const asset = await generateManifestoStoryCard({
        presentation,
        userName,
        categoryLabel,
        cycleLabel,
      });
      setPreviewUrl(asset.dataUrl);
      const { result } = await shareManifestoStoryCard({
        presentation,
        userName,
        categoryLabel,
        cycleLabel,
      });
      if (result === "shared") {
        setStatus("Paylaşım menüsü açıldı");
      } else if (result === "downloaded") {
        setStatus("Görsel yeni sekmede — indirebilirsiniz");
      }
    } catch {
      setStatus("Paylaşım başarısız");
    } finally {
      setBusy(false);
    }
  }, [presentation, userName, categoryLabel, cycleLabel]);

  const handleDownload = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const asset = await generateManifestoStoryCard({
        presentation,
        userName,
        categoryLabel,
        cycleLabel,
      });
      setPreviewUrl(asset.dataUrl);
      downloadManifestoStoryCard(asset);
      setStatus("Görsel indirildi");
    } catch {
      setStatus("İndirme başarısız");
    } finally {
      setBusy(false);
    }
  }, [presentation, userName, categoryLabel, cycleLabel]);

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-2xl border border-violet-400/25 bg-[#0a0f1a] shadow-[0_0_40px_rgba(139,92,246,0.15)]">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Manifesto story önizleme"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="h-16 w-16 rounded-full bg-violet-500/10 blur-xl" aria-hidden />
            <p className="text-[10px] uppercase tracking-[0.2em] text-violet-200/60">
              9:16 Story
            </p>
            <p className="line-clamp-4 text-xs italic text-white/55">
              {presentation.manifestoClaim}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleShare()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs font-medium text-amber-100 transition hover:bg-amber-400/18 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Share2 className="h-4 w-4" aria-hidden />
          )}
          Hikayede Paylaş
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleDownload()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden />
          Görseli İndir
        </button>
      </div>

      {status ? (
        <p className="text-center text-[10px] text-white/45">{status}</p>
      ) : null}
    </div>
  );
}
