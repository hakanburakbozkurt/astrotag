"use client";

import {
  SOCIAL_BRAND_DOMAIN,
  SOCIAL_BRAND_URL,
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_COLORS,
  SOCIAL_LAYOUT,
  getSocialShareQrUrl,
} from "@/lib/social/constants";
import type { ManifestoPresentation } from "@/lib/manifesto/manifesto-presentation";
import {
  downloadShareableCard,
  openShareableCardInNewTab,
  type KozmicShareResult,
  type ShareableCardAsset,
} from "@/lib/utils/share-utils";

export type ManifestoStoryCardInput = {
  presentation: ManifestoPresentation;
  userName?: string;
  cycleLabel?: string;
  categoryLabel?: string;
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines?: number
): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  let line = "";
  let cursorY = y;
  let lines = 0;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
      lines += 1;
      if (maxLines && lines >= maxLines) {
        return cursorY;
      }
    } else {
      line = testLine;
    }
  }

  if (line && (!maxLines || lines < maxLines)) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }

  return cursorY;
}

function drawStarfield(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = SOCIAL_COLORS.background;
  ctx.fillRect(0, 0, SOCIAL_CANVAS_WIDTH, SOCIAL_CANVAS_HEIGHT);

  for (let i = 0; i < 120; i += 1) {
    const x = (i * 137.508) % SOCIAL_CANVAS_WIDTH;
    const y = (i * 97.31) % SOCIAL_CANVAS_HEIGHT;
    const r = i % 3 === 0 ? 2.2 : 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = i % 5 === 0 ? SOCIAL_COLORS.amber : "rgba(255,255,255,0.35)";
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(540, 420, 20, 540, 420, 520);
  glow.addColorStop(0, "rgba(139,92,246,0.22)");
  glow.addColorStop(0.5, "rgba(251,191,36,0.08)");
  glow.addColorStop(1, "rgba(10,15,26,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SOCIAL_CANVAS_WIDTH, SOCIAL_CANVAS_HEIGHT);
}

async function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("QR yüklenemedi"));
    image.src = source;
  });
}

async function drawFooter(ctx: CanvasRenderingContext2D): Promise<void> {
  const footerY = SOCIAL_CANVAS_HEIGHT - SOCIAL_LAYOUT.footerHeight;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(0, footerY, SOCIAL_CANVAS_WIDTH, SOCIAL_LAYOUT.footerHeight);

  ctx.fillStyle = SOCIAL_COLORS.amber;
  ctx.font = "700 36px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("AstroTag", SOCIAL_LAYOUT.paddingX, footerY + 56);

  ctx.fillStyle = SOCIAL_COLORS.textMuted;
  ctx.font = "400 24px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(SOCIAL_BRAND_DOMAIN, SOCIAL_LAYOUT.paddingX, footerY + 92);

  try {
    const qr = await loadImage(getSocialShareQrUrl(SOCIAL_LAYOUT.qrSize));
    ctx.drawImage(
      qr,
      SOCIAL_CANVAS_WIDTH - SOCIAL_LAYOUT.paddingX - SOCIAL_LAYOUT.qrSize,
      footerY + 36,
      SOCIAL_LAYOUT.qrSize,
      SOCIAL_LAYOUT.qrSize
    );
  } catch {
    // QR opsiyonel
  }
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

  drawStarfield(ctx);

  const pad = SOCIAL_LAYOUT.paddingX;
  const maxWidth = SOCIAL_CANVAS_WIDTH - pad * 2;

  ctx.fillStyle = SOCIAL_COLORS.amberMuted;
  ctx.font = "600 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("GÜNLÜK KOZMİK MANİFESTO", pad, 120);

  if (input.categoryLabel) {
    ctx.fillStyle = SOCIAL_COLORS.textMuted;
    ctx.font = "500 24px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(input.categoryLabel.toUpperCase(), pad, 162);
  }

  if (input.userName?.trim()) {
    ctx.fillStyle = SOCIAL_COLORS.textSecondary;
    ctx.font = "400 26px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(input.userName.trim(), pad, 204);
  }

  ctx.strokeStyle = "rgba(251,191,36,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, 240);
  ctx.lineTo(SOCIAL_CANVAS_WIDTH - pad, 240);
  ctx.stroke();

  ctx.fillStyle = SOCIAL_COLORS.textSecondary;
  ctx.font = "italic 400 34px ui-serif, Georgia, serif";
  let cursorY = wrapText(
    ctx,
    input.presentation.cosmicHook,
    pad,
    310,
    maxWidth,
    48,
    5
  );

  cursorY += 48;

  ctx.fillStyle = SOCIAL_COLORS.amber;
  ctx.font = "700 42px ui-serif, Georgia, serif";
  wrapText(
    ctx,
    `"${input.presentation.manifestoClaim}"`,
    pad,
    cursorY,
    maxWidth,
    56,
    6
  );

  if (input.cycleLabel) {
    ctx.fillStyle = SOCIAL_COLORS.textMuted;
    ctx.font = "500 24px ui-monospace, monospace";
    ctx.fillText(input.cycleLabel, pad, SOCIAL_CANVAS_HEIGHT - SOCIAL_LAYOUT.footerHeight - 48);
  }

  await drawFooter(ctx);

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
    shareText: `${input.presentation.manifestoClaim}\n\n${SOCIAL_BRAND_URL}`,
  };
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

  openShareableCardInNewTab(asset);
  return { result: "downloaded", asset };
}

export function downloadManifestoStoryCard(asset: ShareableCardAsset): void {
  downloadShareableCard(asset);
}
