"use client";

import {
  SOCIAL_BRAND_DOMAIN,
  SOCIAL_BRAND_URL,
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_COLORS,
  SOCIAL_LAYOUT,
  SOCIAL_VIDEO,
  getSocialShareQrUrl,
} from "@/lib/social/constants";
import type { ManifestoPresentation } from "@/lib/manifesto/manifesto-presentation";
import {
  drawManifestoStoryContent,
  type ManifestoStoryContentInput,
} from "@/lib/manifesto/manifesto-story-layout";

export { drawManifestoStoryContent } from "@/lib/manifesto/manifesto-story-layout";
import {
  createManifestoStarfield,
  drawManifestoStarfield,
  updateManifestoStarfield,
  type ManifestoStarParticle,
} from "@/lib/manifesto/manifesto-starfield";
import {
  downloadShareableCard,
  type KozmicShareResult,
  type ShareableCardAsset,
} from "@/lib/utils/share-utils";

export type ManifestoStoryCardInput = ManifestoStoryContentInput & {
  presentation: ManifestoPresentation;
};

export type ManifestoStoryVideoShareOutcome = {
  result: KozmicShareResult;
  message: string;
  usedFallback: boolean;
};

export const MANIFESTO_VIDEO_DOWNLOAD_MESSAGE =
  "Video galerinize indirildi! Şimdi Instagram veya TikTok'u açarak hikayenizde paylaşabilirsiniz.";

/** @deprecated İndirme odaklı akışta kullanılmıyor */
export const MANIFESTO_VIDEO_FALLBACK_MESSAGE = MANIFESTO_VIDEO_DOWNLOAD_MESSAGE;

export type ManifestoStoryVideoAsset = {
  blob: Blob;
  mimeType: string;
  fileName: string;
  shareText: string;
  objectUrl: string;
};

async function loadImage(source: string): Promise<HTMLImageElement | null> {
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Görsel yüklenemedi"));
      image.src = source;
    });
  } catch {
    return null;
  }
}

function buildShareText(input: ManifestoStoryCardInput): string {
  return `${input.presentation.manifestoClaim}\n\n${SOCIAL_BRAND_URL}`;
}

export async function drawManifestoStoryFooter(
  ctx: CanvasRenderingContext2D,
  qrImage: HTMLImageElement | null
): Promise<void> {
  const footerY = SOCIAL_CANVAS_HEIGHT - SOCIAL_LAYOUT.footerHeight;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(0, footerY, SOCIAL_CANVAS_WIDTH, SOCIAL_LAYOUT.footerHeight);

  ctx.fillStyle = SOCIAL_COLORS.amber;
  ctx.font = "700 36px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("AstroTag", SOCIAL_LAYOUT.paddingX, footerY + 56);

  ctx.fillStyle = SOCIAL_COLORS.textMuted;
  ctx.font = "400 24px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(SOCIAL_BRAND_DOMAIN, SOCIAL_LAYOUT.paddingX, footerY + 92);

  if (qrImage) {
    ctx.drawImage(
      qrImage,
      SOCIAL_CANVAS_WIDTH - SOCIAL_LAYOUT.paddingX - SOCIAL_LAYOUT.qrSize,
      footerY + 36,
      SOCIAL_LAYOUT.qrSize,
      SOCIAL_LAYOUT.qrSize
    );
  }
}

export async function renderManifestoStoryFrame(
  ctx: CanvasRenderingContext2D,
  input: ManifestoStoryCardInput,
  particles: ManifestoStarParticle[],
  timeMs: number,
  qrImage: HTMLImageElement | null,
  contentAlpha = 1
): Promise<void> {
  updateManifestoStarfield(particles);
  drawManifestoStarfield(ctx, particles, SOCIAL_CANVAS_WIDTH, SOCIAL_CANVAS_HEIGHT, timeMs);
  drawManifestoStoryContent(ctx, input, { contentAlpha });
  await drawManifestoStoryFooter(ctx, qrImage);
}

function pickSupportedVideoMimeType(): string {
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

function contentAlphaForProgress(progress: number): number {
  if (progress <= 0.12) {
    return progress / 0.12;
  }
  return 1;
}

export async function generateManifestoStoryVideo(
  input: ManifestoStoryCardInput,
  options?: { durationMs?: number }
): Promise<ManifestoStoryVideoAsset> {
  if (typeof document === "undefined") {
    throw new Error("Video yalnızca tarayıcıda oluşturulabilir");
  }

  const durationMs = clamp(
    options?.durationMs ?? 6000,
    SOCIAL_VIDEO.minDurationMs,
    7000
  );
  const totalFrames = Math.round((durationMs / 1000) * SOCIAL_VIDEO.fps);
  const particles = createManifestoStarfield();
  const qrImage = await loadImage(getSocialShareQrUrl(SOCIAL_LAYOUT.qrSize));

  const canvas = document.createElement("canvas");
  canvas.width = SOCIAL_CANVAS_WIDTH;
  canvas.height = SOCIAL_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas oluşturulamadı");
  }

  const mimeType = pickSupportedVideoMimeType();
  const stream = canvas.captureStream(SOCIAL_VIDEO.fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const finished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.onerror = () => reject(new Error("Video kaydı başarısız"));
  });

  recorder.start();
  const startedAt = performance.now();

  for (let frame = 0; frame < totalFrames; frame += 1) {
    const progress = frame / Math.max(totalFrames - 1, 1);
    const timeMs = startedAt + frame * (1000 / SOCIAL_VIDEO.fps);
    await renderManifestoStoryFrame(
      ctx,
      input,
      particles,
      timeMs,
      qrImage,
      contentAlphaForProgress(progress)
    );
    await waitFrame();
  }

  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());

  const blob = await finished;
  const stamp = new Date().toISOString().slice(0, 10);
  const extension = mimeType.includes("webm") ? "webm" : "mp4";

  return {
    blob,
    mimeType,
    fileName: `astro-tag-manifesto-story-${stamp}.${extension}`,
    shareText: buildShareText(input),
    objectUrl: URL.createObjectURL(blob),
  };
}

export async function generateManifestoStoryCard(
  input: ManifestoStoryCardInput
): Promise<ShareableCardAsset> {
  const canvas = document.createElement("canvas");
  canvas.width = SOCIAL_CANVAS_WIDTH;
  canvas.height = SOCIAL_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas oluşturulamadı");
  }

  const particles = createManifestoStarfield();
  const qrImage = await loadImage(getSocialShareQrUrl(SOCIAL_LAYOUT.qrSize));
  await renderManifestoStoryFrame(ctx, input, particles, 0, qrImage, 1);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) {
        resolve(b);
      } else {
        reject(new Error("PNG oluşturulamadı"));
      }
    }, "image/png");
  });

  const dataUrl = canvas.toDataURL("image/png");
  const stamp = new Date().toISOString().slice(0, 10);

  return {
    blob,
    dataUrl,
    fileName: `astro-tag-manifesto-story-${stamp}.png`,
    shareText: buildShareText(input),
  };
}

export function downloadManifestoStoryVideo(asset: ManifestoStoryVideoAsset): void {
  const link = document.createElement("a");
  link.href = asset.objectUrl;
  link.download = asset.fileName;
  link.click();
}

export function revokeManifestoStoryVideo(asset: ManifestoStoryVideoAsset): void {
  URL.revokeObjectURL(asset.objectUrl);
}

export function deliverManifestoStoryVideo(
  asset: ManifestoStoryVideoAsset
): ManifestoStoryVideoShareOutcome {
  downloadManifestoStoryVideo(asset);
  return {
    result: "downloaded",
    message: MANIFESTO_VIDEO_DOWNLOAD_MESSAGE,
    usedFallback: false,
  };
}

/** İndirme odaklı ana paylaşım akışı — navigator.share kullanılmaz */
export async function shareManifestoStoryVideo(
  asset: ManifestoStoryVideoAsset
): Promise<ManifestoStoryVideoShareOutcome> {
  return deliverManifestoStoryVideo(asset);
}

export async function shareManifestoStoryCard(
  input: ManifestoStoryCardInput
): Promise<{ result: KozmicShareResult; asset: ShareableCardAsset }> {
  const asset = await generateManifestoStoryCard(input);

  if (typeof navigator !== "undefined" && navigator.share) {
    const file = new File([asset.blob], asset.fileName, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "AstroTag · Günlük Kozmik Manifesto",
          text: asset.shareText,
          files: [file],
        });
        return { result: "shared", asset };
      }
      await navigator.share({ title: "AstroTag", text: asset.shareText });
      return { result: "shared", asset };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { result: "cancelled", asset };
      }
    }
  }

  downloadShareableCard(asset);
  return { result: "downloaded", asset };
}

export function downloadManifestoStoryCard(asset: ShareableCardAsset): void {
  downloadShareableCard(asset);
}
