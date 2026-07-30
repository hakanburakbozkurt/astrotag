"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, Share2, Video } from "lucide-react";
import ManifestoStoryPreview from "@/components/home/ManifestoStoryPreview";
import type { ManifestoPresentation } from "@/lib/manifesto/manifesto-presentation";
import {
  deliverManifestoStoryVideo,
  MANIFESTO_VIDEO_MP4_DOWNLOAD_MESSAGE,
  prepareManifestoStoryMp4,
  revokeManifestoStoryVideo,
  type ManifestoStoryVideoAsset,
  type ManifestoVideoPipelineStage,
} from "@/lib/manifesto/manifesto-story-card";

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

function pipelineProgressPercent(stage: ManifestoVideoPipelineStage | null): number {
  if (!stage) {
    return 0;
  }
  if (stage.phase === "rendering") {
    return Math.min(35, 8 + stage.elapsedSec * 4);
  }
  if (stage.phase === "loading-ffmpeg") {
    return 35 + Math.round(((stage.progress ?? 0) / 100) * 25);
  }
  return 60 + Math.round(((stage.progress ?? 0) / 100) * 40);
}

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
  const [pipelineStage, setPipelineStage] = useState<ManifestoVideoPipelineStage | null>(
    null
  );
  const videoAssetRef = useRef<ManifestoStoryVideoAsset | null>(null);

  const cardInput = useMemo(
    () => ({
      presentation,
      userName,
      categoryLabel,
      cycleLabel,
    }),
    [presentation, userName, categoryLabel, cycleLabel]
  );

  useEffect(() => {
    if (videoAssetRef.current) {
      revokeManifestoStoryVideo(videoAssetRef.current);
      videoAssetRef.current = null;
    }
  }, [cardInput]);

  const ensureMp4Video = useCallback(async (): Promise<ManifestoStoryVideoAsset> => {
    if (videoAssetRef.current) {
      return videoAssetRef.current;
    }

    const asset = await prepareManifestoStoryMp4(cardInput, setPipelineStage);
    videoAssetRef.current = asset;
    return asset;
  }, [cardInput]);

  const runVideoDownloadFlow = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    setPipelineStage(null);

    try {
      const asset = await ensureMp4Video();
      deliverManifestoStoryVideo(asset);
      setStatus(MANIFESTO_VIDEO_MP4_DOWNLOAD_MESSAGE);
    } catch {
      setStatus("Video oluşturulamadı — tekrar deneyin");
    } finally {
      setBusy(false);
      setPipelineStage(null);
    }
  }, [ensureMp4Video]);

  useEffect(() => {
    return () => {
      if (videoAssetRef.current) {
        revokeManifestoStoryVideo(videoAssetRef.current);
      }
    };
  }, []);

  const progressPercent = pipelineProgressPercent(pipelineStage);

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-2xl border border-violet-400/25 bg-[#0a0f1a] shadow-[0_0_40px_rgba(139,92,246,0.18)]">
        <ManifestoStoryPreview input={cardInput} />
        <div
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
          aria-hidden
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void runVideoDownloadFlow()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-xs font-medium text-amber-100 transition hover:bg-amber-400/18 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Share2 className="h-4 w-4" aria-hidden />
          )}
          Paylaş
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runVideoDownloadFlow()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden />
          Videoyu İndir
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void runVideoDownloadFlow()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-400/25 bg-gradient-to-br from-pink-500/10 to-purple-600/10 px-3 py-2.5 text-xs font-medium text-pink-100 transition hover:from-pink-500/16 disabled:opacity-50"
        >
          <InstagramIcon className="h-4 w-4" />
          Instagram
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runVideoDownloadFlow()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 to-slate-500/10 px-3 py-2.5 text-xs font-medium text-cyan-100 transition hover:from-cyan-500/16 disabled:opacity-50"
        >
          <Video className="h-4 w-4" aria-hidden />
          TikTok
        </button>
      </div>

      {busy && pipelineStage ? (
        <div
          className="rounded-xl border border-violet-400/20 bg-violet-500/[0.08] px-3.5 py-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-2 text-[10px] text-violet-100/80">
            <span>{pipelineStage.label}</span>
            <span className="tabular-nums text-violet-200/60">{pipelineStage.elapsedSec}s</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-amber-300 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {pipelineStage.phase === "transcoding" ? (
            <p className="mt-2 text-[10px] text-white/40">
              H.264 MP4 · Instagram & TikTok uyumlu
            </p>
          ) : null}
        </div>
      ) : busy ? (
        <p className="text-center text-[10px] text-violet-200/60">
          Story video hazırlanıyor…
        </p>
      ) : null}

      {status ? (
        <div
          role="status"
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left ${
            status === MANIFESTO_VIDEO_MP4_DOWNLOAD_MESSAGE
              ? "border-amber-400/30 bg-gradient-to-br from-amber-500/14 to-violet-500/10 text-amber-50/95"
              : "border-red-400/25 bg-red-500/10 text-red-200/90"
          }`}
        >
          {status === MANIFESTO_VIDEO_MP4_DOWNLOAD_MESSAGE ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
          ) : null}
          <p className="text-[11px] leading-relaxed">{status}</p>
        </div>
      ) : null}
    </div>
  );
}
