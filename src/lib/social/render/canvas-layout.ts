import {
  SOCIAL_BRAND_DOMAIN,
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_COLORS,
  SOCIAL_LAYOUT,
  getSocialShareQrUrl,
} from "../constants";
import type { SocialSharePayload } from "../types";

export function createSocialCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SOCIAL_CANVAS_WIDTH;
  canvas.height = SOCIAL_CANVAS_HEIGHT;
  return canvas;
}

export function drawSocialBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = SOCIAL_COLORS.background;
  ctx.fillRect(0, 0, SOCIAL_CANVAS_WIDTH, SOCIAL_CANVAS_HEIGHT);

  ctx.strokeStyle = SOCIAL_COLORS.grid;
  ctx.lineWidth = 1;
  const step = 48;
  for (let x = 0; x <= SOCIAL_CANVAS_WIDTH; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, SOCIAL_CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= SOCIAL_CANVAS_HEIGHT; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SOCIAL_CANVAS_WIDTH, y);
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(820, 180, 20, 820, 180, 260);
  glow.addColorStop(0, "rgba(251,191,36,0.12)");
  glow.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SOCIAL_CANVAS_WIDTH, SOCIAL_CANVAS_HEIGHT);
}

export async function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Görsel yüklenemedi"));
    image.src = source;
  });
}

export async function drawBrandFooter(ctx: CanvasRenderingContext2D): Promise<void> {
  const footerTop = SOCIAL_CANVAS_HEIGHT - SOCIAL_LAYOUT.footerHeight;
  const qrX = SOCIAL_CANVAS_WIDTH - SOCIAL_LAYOUT.paddingX - SOCIAL_LAYOUT.qrSize;
  const qrY = footerTop + 36;

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(0, footerTop, SOCIAL_CANVAS_WIDTH, SOCIAL_LAYOUT.footerHeight);

  ctx.fillStyle = SOCIAL_COLORS.amberMuted;
  ctx.font = "600 28px ui-monospace, monospace";
  ctx.fillText(SOCIAL_BRAND_DOMAIN, SOCIAL_LAYOUT.paddingX, footerTop + 72);

  ctx.fillStyle = SOCIAL_COLORS.textMuted;
  ctx.font="400 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Kişisel astroloji pusulan", SOCIAL_LAYOUT.paddingX, footerTop + 108);

  const qr = await loadImage(getSocialShareQrUrl(SOCIAL_LAYOUT.qrSize));
  ctx.drawImage(qr, qrX, qrY, SOCIAL_LAYOUT.qrSize, SOCIAL_LAYOUT.qrSize);
}

export function drawHeaderBlock(
  ctx: CanvasRenderingContext2D,
  payload: SocialSharePayload
): void {
  ctx.fillStyle = SOCIAL_COLORS.amberMuted;
  ctx.font = "600 24px ui-monospace, monospace";
  ctx.fillText(payload.eyebrow, SOCIAL_LAYOUT.paddingX, SOCIAL_LAYOUT.paddingTop);

  ctx.fillStyle = SOCIAL_COLORS.textMuted;
  ctx.font = "400 22px ui-monospace, monospace";
  ctx.fillText(payload.dateLabel, SOCIAL_LAYOUT.paddingX, SOCIAL_LAYOUT.paddingTop + 36);

  ctx.fillStyle = SOCIAL_COLORS.textPrimary;
  ctx.font = "700 52px ui-sans-serif, system-ui, sans-serif";
  wrapText(ctx, payload.title, SOCIAL_LAYOUT.paddingX, SOCIAL_LAYOUT.paddingTop + 96, 936, 58);

  if (payload.subtitle) {
    ctx.fillStyle = SOCIAL_COLORS.amber;
    ctx.font = "600 24px ui-monospace, monospace";
    ctx.fillText(payload.subtitle.toUpperCase(), SOCIAL_LAYOUT.paddingX, SOCIAL_LAYOUT.paddingTop + 168);
  }
}

export function drawScoreBadge(
  ctx: CanvasRenderingContext2D,
  score: SocialSharePayload["score"],
  x: number,
  y: number
): void {
  if (!score) return;

  const radius = 88;
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(251,191,36,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(251,191,36,0.45)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = SOCIAL_COLORS.textPrimary;
  ctx.font = "700 64px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(score.value), x + radius, y + radius + 18);
  ctx.textAlign = "left";

  ctx.fillStyle = SOCIAL_COLORS.textSecondary;
  ctx.font = "500 20px ui-monospace, monospace";
  ctx.fillText(score.label, x + radius * 2 + 32, y + radius + 8);
  if (score.max) {
    ctx.fillStyle = SOCIAL_COLORS.textMuted;
    ctx.fillText(`/ ${score.max}`, x + radius * 2 + 32, y + radius + 36);
  }
}

export function drawBodyBlock(
  ctx: CanvasRenderingContext2D,
  payload: SocialSharePayload,
  startY: number,
  maxWidth = 936
): number {
  ctx.fillStyle = SOCIAL_COLORS.textSecondary;
  ctx.font = "400 30px ui-sans-serif, system-ui, sans-serif";
  let y = wrapText(ctx, payload.body, SOCIAL_LAYOUT.paddingX, startY, maxWidth, 42);

  if (payload.excerpt) {
    y += 24;
    ctx.fillStyle = SOCIAL_COLORS.textMuted;
    ctx.font = "400 24px ui-sans-serif, system-ui, sans-serif";
    y = wrapText(ctx, payload.excerpt, SOCIAL_LAYOUT.paddingX, y, maxWidth, 34);
  }

  return y;
}

export async function drawChartImage(
  ctx: CanvasRenderingContext2D,
  chartDataUrl: string,
  centerX: number,
  centerY: number,
  size: number
): Promise<void> {
  const image = await loadImage(chartDataUrl);
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, centerX - size / 2, centerY - size / 2, size, size);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(251,191,36,0.35)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }

  return cursorY;
}
