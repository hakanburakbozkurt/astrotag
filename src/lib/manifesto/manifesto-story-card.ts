"use client";

import {
  SOCIAL_BRAND_URL,
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_COLORS,
  SOCIAL_LAYOUT,
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

/** Manifesto story kart markası — footer ve dosya adları */
export const MANIFESTO_STORY_BRAND = "astrotag.app";

export const MANIFESTO_SNAPSHOT_DOWNLOAD_MESSAGE =
  "Ekran görüntüsü galerinize indirildi! Instagram veya TikTok hikayende paylaşabilirsin.";

export type ManifestoStoryCardInput = ManifestoStoryContentInput & {
  presentation: ManifestoPresentation;
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

export function manifestoSnapshotFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `astrotag-manifesto-story-${stamp}.png`;
}

export async function drawManifestoStoryFooter(
  ctx: CanvasRenderingContext2D,
  qrImage: HTMLImageElement | null
): Promise<void> {
  const footerY = SOCIAL_CANVAS_HEIGHT - SOCIAL_LAYOUT.footerHeight;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(0, footerY, SOCIAL_CANVAS_WIDTH, SOCIAL_LAYOUT.footerHeight);

  ctx.fillStyle = SOCIAL_COLORS.amber;
  ctx.font = "600 28px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(MANIFESTO_STORY_BRAND, SOCIAL_LAYOUT.paddingX, footerY + 72);

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

  return {
    blob,
    dataUrl: canvas.toDataURL("image/png"),
    fileName: manifestoSnapshotFileName(),
    shareText: buildShareText(input),
  };
}

export function downloadManifestoStorySnapshot(blob: Blob, fileName?: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName ?? manifestoSnapshotFileName();
  link.click();
  URL.revokeObjectURL(url);
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
          title: `${MANIFESTO_STORY_BRAND} · Günlük Kozmik Manifesto`,
          text: asset.shareText,
          files: [file],
        });
        return { result: "shared", asset };
      }
      await navigator.share({
        title: MANIFESTO_STORY_BRAND,
        text: asset.shareText,
      });
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
