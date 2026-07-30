"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

/** CDN üzerinden tek iş parçacıklı core — COOP/COEP gerektirmez */
const FFMPEG_CORE_VERSION = "0.12.6";
const FFMPEG_CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

export type ManifestoTranscodeProgress = {
  phase: "loading-ffmpeg" | "transcoding";
  /** 0–100 */
  progress: number;
  elapsedSec: number;
};

function elapsedSec(sinceMs: number): number {
  return Math.max(0, Math.round((performance.now() - sinceMs) / 1000));
}

async function loadFFmpeg(
  onProgress?: (progress: ManifestoTranscodeProgress) => void,
  startedAt = performance.now()
): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance;
  }

  if (ffmpegLoadPromise) {
    return ffmpegLoadPromise;
  }

  ffmpegLoadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    ffmpeg.on("progress", ({ progress }) => {
      onProgress?.({
        phase: "transcoding",
        progress: Math.min(99, Math.round(progress * 100)),
        elapsedSec: elapsedSec(startedAt),
      });
    });

    onProgress?.({
      phase: "loading-ffmpeg",
      progress: 8,
      elapsedSec: elapsedSec(startedAt),
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });

    onProgress?.({
      phase: "loading-ffmpeg",
      progress: 100,
      elapsedSec: elapsedSec(startedAt),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await ffmpegLoadPromise;
  } catch (error) {
    ffmpegLoadPromise = null;
    throw error;
  }
}

/**
 * MediaRecorder .webm → H.264 .mp4 (yuv420p, Instagram/TikTok uyumlu).
 */
export async function transcodeManifestoWebmToMp4(
  webmBlob: Blob,
  onProgress?: (progress: ManifestoTranscodeProgress) => void
): Promise<Blob> {
  const startedAt = performance.now();
  const ffmpeg = await loadFFmpeg(onProgress, startedAt);

  const inputName = "manifesto-input.webm";
  const outputName = "manifesto-output.mp4";

  await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));

  onProgress?.({
    phase: "transcoding",
    progress: 4,
    elapsedSec: elapsedSec(startedAt),
  });

  await ffmpeg.exec([
    "-i",
    inputName,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "22",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-r",
    "30",
    "-an",
    outputName,
  ]);

  const output = await ffmpeg.readFile(outputName);

  try {
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch {
    // Temizlik opsiyonel
  }

  onProgress?.({
    phase: "transcoding",
    progress: 100,
    elapsedSec: elapsedSec(startedAt),
  });

  const bytes =
    output instanceof Uint8Array
      ? output
      : new TextEncoder().encode(String(output));

  return new Blob([bytes as BlobPart], { type: "video/mp4" });
}
