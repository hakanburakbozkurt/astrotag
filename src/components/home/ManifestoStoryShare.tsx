"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, Download, ImageDown, Loader2 } from "lucide-react";
import ManifestoStoryPreview, {
  type ManifestoStoryPreviewHandle,
} from "@/components/home/ManifestoStoryPreview";
import type { ManifestoPresentation } from "@/lib/manifesto/manifesto-presentation";
import {
  downloadManifestoStorySnapshot,
  MANIFESTO_SNAPSHOT_DOWNLOAD_MESSAGE,
  manifestoSnapshotFileName,
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
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const previewRef = useRef<ManifestoStoryPreviewHandle>(null);

  const cardInput = {
    presentation,
    userName,
    categoryLabel,
    cycleLabel,
  };

  const handleDownloadSnapshot = useCallback(async () => {
    setBusy(true);
    setStatus(null);

    try {
      const blob = await previewRef.current?.capturePng();
      if (!blob) {
        throw new Error("Önizleme hazır değil");
      }

      downloadManifestoStorySnapshot(blob, manifestoSnapshotFileName());
      setStatus(MANIFESTO_SNAPSHOT_DOWNLOAD_MESSAGE);
    } catch {
      setStatus("Ekran görüntüsü oluşturulamadı — tekrar deneyin");
    } finally {
      setBusy(false);
    }
  }, []);

  const isSuccess = status === MANIFESTO_SNAPSHOT_DOWNLOAD_MESSAGE;

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-2xl border border-violet-400/25 bg-[#0a0f1a] shadow-[0_0_40px_rgba(139,92,246,0.18)]">
        <ManifestoStoryPreview ref={previewRef} input={cardInput} />
        <div
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
          aria-hidden
        />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void handleDownloadSnapshot()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/12 via-violet-500/10 to-amber-500/12 px-4 py-3 text-sm font-medium text-amber-100 transition hover:from-amber-500/20 hover:to-violet-500/16 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <ImageDown className="h-4 w-4" aria-hidden />
        )}
        Ekran Görüntüsü İndir
      </button>

      <p className="text-center text-[10px] text-white/35">
        9:16 · PNG · astrotag.app
      </p>

      {busy ? (
        <p className="text-center text-[10px] text-violet-200/60">
          Yüksek kaliteli görsel hazırlanıyor…
        </p>
      ) : null}

      {status ? (
        <div
          role="status"
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left ${
            isSuccess
              ? "border-amber-400/30 bg-gradient-to-br from-amber-500/14 to-violet-500/10 text-amber-50/95"
              : "border-red-400/25 bg-red-500/10 text-red-200/90"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
          ) : (
            <Download className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
          )}
          <p className="text-[11px] leading-relaxed">{status}</p>
        </div>
      ) : null}
    </div>
  );
}
