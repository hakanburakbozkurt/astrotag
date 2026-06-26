import {
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_VIDEO,
} from "../constants";
import type { SocialShareVideoInput } from "../types";
import { createSocialCanvas } from "../render/canvas-layout";
import { renderBrandCardFrame, renderShareTemplate } from "../render/templates";
import {
  defaultAspectStrokeProgress,
  drawAspectStrokes,
} from "./aspect-animation";
import { typingEffectText, typingProgressForFrame } from "./typing-effect";

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Video karesi oluşturulamadı"))),
      mimeType
    );
  });
}

/**
 * Canvas → WebM (MediaRecorder). Tarayıcıda gerçek MP4 encode yok;
 * TikTok/Reels share sheet WebM kabul eder, MP4 için ileride ffmpeg.wasm eklenebilir.
 */
export async function exportSocialShareVideo(
  input: SocialShareVideoInput
): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("Video export yalnızca tarayıcıda çalışır");
  }

  const durationMs = clamp(
    input.durationMs ?? SOCIAL_VIDEO.defaultDurationMs,
    SOCIAL_VIDEO.minDurationMs,
    SOCIAL_VIDEO.maxDurationMs
  );
  const brandFrames = Math.round(
    (SOCIAL_VIDEO.brandCardDurationMs / durationMs) *
      (durationMs / 1000) *
      SOCIAL_VIDEO.fps
  );
  const totalFrames = Math.round((durationMs / 1000) * SOCIAL_VIDEO.fps);
  const mainFrames = Math.max(1, totalFrames - brandFrames);

  const canvas = createSocialCanvas();
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context alınamadı");
  }

  const stream = canvas.captureStream(SOCIAL_VIDEO.fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: pickSupportedMimeType(),
    videoBitsPerSecond: 6_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const finished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || SOCIAL_VIDEO.mimeType }));
    };
    recorder.onerror = () => reject(new Error("Video kaydı başarısız"));
  });

  recorder.start();

  for (let frame = 0; frame < mainFrames; frame += 1) {
    await renderShareTemplate(ctx, input.payload, input.chart.dataUrl);

    if (input.aspectStrokes?.length) {
      const strokes = input.aspectStrokes.map((stroke, index) => ({
        ...stroke,
        progress: defaultAspectStrokeProgress(
          frame,
          mainFrames,
          index,
          input.aspectStrokes!.length
        ),
      }));
      drawAspectStrokes(ctx, strokes, 1);
    }

    if (input.typingText) {
      const typingProgress = typingProgressForFrame(frame, mainFrames);
      const typed = typingEffectText(input.typingText, typingProgress);
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.font = "400 28px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(typed, 72, SOCIAL_CANVAS_HEIGHT - 280, 936);
    }

    await waitFrame();
  }

  for (let frame = 0; frame < brandFrames; frame += 1) {
    await renderBrandCardFrame(ctx);
    await waitFrame();
  }

  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());
  return finished;
}

function pickSupportedMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "video/webm";
}

function waitFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function exportSocialShareVideoFallback(
  input: SocialShareVideoInput
): Promise<Blob> {
  const canvas = createSocialCanvas();
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context alınamadı");
  }
  await renderShareTemplate(ctx, input.payload, input.chart.dataUrl);
  return canvasToBlob(canvas, "image/png");
}
