import {
  SOCIAL_BRAND_DOMAIN,
  SOCIAL_BRAND_URL,
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_COLORS,
  SOCIAL_LAYOUT,
  getSocialShareQrUrl,
} from "@/lib/social/constants";

export type OracleShareModuleId =
  | "natal"
  | "synastry"
  | "tarot"
  | "horary"
  | "cosmic-profile";

export interface ShareableCardBranding {
  appName?: string;
  siteUrl?: string;
  domain?: string;
}

export interface ShareableCardModuleContent {
  subtitle?: string;
  score?: number;
  scoreLabel?: string;
  scoreMax?: number;
  cards?: Array<{ name: string; position?: string }>;
  moduleIcon?: string;
  question?: string;
}

export interface GenerateShareableCardInput {
  executiveSummary: string;
  moduleId: OracleShareModuleId;
  moduleLabel: string;
  branding?: ShareableCardBranding;
  content?: ShareableCardModuleContent;
}

export interface ShareableCardAsset {
  blob: Blob;
  dataUrl: string;
  fileName: string;
  shareText: string;
}

export const ORACLE_SHARE_MODULE_META: Record<
  OracleShareModuleId,
  { icon: string; accent: string }
> = {
  natal: { icon: "☉", accent: "#fbbf24" },
  synastry: { icon: "♡", accent: "#34d399" },
  tarot: { icon: "✦", accent: "#fbbf24" },
  horary: { icon: "◷", accent: "#a78bfa" },
  "cosmic-profile": { icon: "✧", accent: "#38bdf8" },
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

async function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Görsel yüklenemedi"));
    image.src = source;
  });
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
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

  const glow = ctx.createRadialGradient(540, 320, 20, 540, 320, 420);
  glow.addColorStop(0, "rgba(251,191,36,0.14)");
  glow.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SOCIAL_CANVAS_WIDTH, SOCIAL_CANVAS_HEIGHT);
}

function drawScoreBadge(
  ctx: CanvasRenderingContext2D,
  score: number,
  label: string,
  max: number,
  accent: string,
  x: number,
  y: number
): number {
  const radius = 72;
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  ctx.fillStyle = `${accent}14`;
  ctx.fill();
  ctx.strokeStyle = `${accent}99`;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = SOCIAL_COLORS.textPrimary;
  ctx.font = "700 56px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(score), x + radius, y + radius + 16);
  ctx.textAlign = "left";

  ctx.fillStyle = SOCIAL_COLORS.textSecondary;
  ctx.font = "500 22px ui-monospace, monospace";
  ctx.fillText(label, x + radius * 2 + 28, y + radius - 4);
  ctx.fillStyle = SOCIAL_COLORS.textMuted;
  ctx.font = "400 20px ui-monospace, monospace";
  ctx.fillText(`/ ${max}`, x + radius * 2 + 28, y + radius + 28);

  return y + radius * 2 + 24;
}

function drawTarotCards(
  ctx: CanvasRenderingContext2D,
  cards: Array<{ name: string; position?: string }>,
  x: number,
  y: number,
  maxWidth: number
): number {
  let cursorY = y;

  for (const card of cards.slice(0, 3)) {
    const label = card.position ? `${card.position} · ${card.name}` : card.name;
    ctx.fillStyle = "rgba(251,191,36,0.08)";
    ctx.strokeStyle = "rgba(251,191,36,0.28)";
    ctx.lineWidth = 2;
    const pillHeight = 52;
    const pillWidth = maxWidth;
    const radius = 14;
    ctx.beginPath();
    ctx.moveTo(x + radius, cursorY);
    ctx.lineTo(x + pillWidth - radius, cursorY);
    ctx.quadraticCurveTo(x + pillWidth, cursorY, x + pillWidth, cursorY + radius);
    ctx.lineTo(x + pillWidth, cursorY + pillHeight - radius);
    ctx.quadraticCurveTo(
      x + pillWidth,
      cursorY + pillHeight,
      x + pillWidth - radius,
      cursorY + pillHeight
    );
    ctx.lineTo(x + radius, cursorY + pillHeight);
    ctx.quadraticCurveTo(x, cursorY + pillHeight, x, cursorY + pillHeight - radius);
    ctx.lineTo(x, cursorY + radius);
    ctx.quadraticCurveTo(x, cursorY, x + radius, cursorY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = SOCIAL_COLORS.amberMuted;
    ctx.font = "600 20px ui-monospace, monospace";
    ctx.fillText("✦", x + 18, cursorY + 34);

    ctx.fillStyle = SOCIAL_COLORS.textPrimary;
    ctx.font = "500 24px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(label, x + 48, cursorY + 34);

    cursorY += pillHeight + 14;
  }

  return cursorY;
}

function drawModuleAccent(
  ctx: CanvasRenderingContext2D,
  input: GenerateShareableCardInput,
  accent: string,
  startY: number
): number {
  const content = input.content;
  const maxWidth = SOCIAL_CANVAS_WIDTH - SOCIAL_LAYOUT.paddingX * 2;
  let y = startY;

  if (content?.score !== undefined && Number.isFinite(content.score)) {
    return drawScoreBadge(
      ctx,
      Math.round(content.score),
      content.scoreLabel ?? "Uyum Skoru",
      content.scoreMax ?? 100,
      accent,
      SOCIAL_LAYOUT.paddingX,
      y
    );
  }

  if (content?.cards && content.cards.length > 0) {
    ctx.fillStyle = SOCIAL_COLORS.textMuted;
    ctx.font = "600 20px ui-monospace, monospace";
    ctx.fillText("KART DİZİLİMİ", SOCIAL_LAYOUT.paddingX, y);
    y += 36;
    return drawTarotCards(ctx, content.cards, SOCIAL_LAYOUT.paddingX, y, maxWidth);
  }

  if (content?.subtitle?.trim()) {
    ctx.fillStyle = accent;
    ctx.font = "600 24px ui-monospace, monospace";
    y = wrapText(
      ctx,
      content.subtitle.trim().toUpperCase(),
      SOCIAL_LAYOUT.paddingX,
      y,
      maxWidth,
      32,
      2
    );
    return y + 12;
  }

  return y;
}

async function drawFooter(
  ctx: CanvasRenderingContext2D,
  branding: ShareableCardBranding
): Promise<void> {
  const footerTop = SOCIAL_CANVAS_HEIGHT - SOCIAL_LAYOUT.footerHeight;
  const appName = branding.appName ?? "ASTROTAG";
  const domain = branding.domain ?? SOCIAL_BRAND_DOMAIN;

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, footerTop, SOCIAL_CANVAS_WIDTH, SOCIAL_LAYOUT.footerHeight);

  ctx.strokeStyle = "rgba(251,191,36,0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(SOCIAL_LAYOUT.paddingX, footerTop);
  ctx.lineTo(SOCIAL_CANVAS_WIDTH - SOCIAL_LAYOUT.paddingX, footerTop);
  ctx.stroke();

  const qrSize = SOCIAL_LAYOUT.qrSize;
  const qrX = SOCIAL_CANVAS_WIDTH - SOCIAL_LAYOUT.paddingX - qrSize;
  const qrY = footerTop + 44;

  try {
    const qr = await loadImage(getSocialShareQrUrl(qrSize));
    ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);
  } catch {
    ctx.fillStyle = SOCIAL_COLORS.textMuted;
    ctx.font = "400 18px ui-monospace, monospace";
    ctx.fillText("QR", qrX + qrSize / 2 - 12, qrY + qrSize / 2);
  }

  ctx.fillStyle = SOCIAL_COLORS.amberMuted;
  ctx.font = "700 32px ui-monospace, monospace";
  ctx.fillText(appName, SOCIAL_LAYOUT.paddingX, footerTop + 72);

  ctx.fillStyle = SOCIAL_COLORS.textMuted;
  ctx.font = "500 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(domain, SOCIAL_LAYOUT.paddingX, footerTop + 112);

  ctx.fillStyle = SOCIAL_COLORS.textMuted;
  ctx.font = "400 20px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Kişisel kozmik rehberin", SOCIAL_LAYOUT.paddingX, footerTop + 148);
}

function buildShareText(input: GenerateShareableCardInput): string {
  const url = input.branding?.siteUrl ?? SOCIAL_BRAND_URL;
  const summary = input.executiveSummary.trim();
  const lines = [
    `✦ AstroTag · ${input.moduleLabel}`,
    input.content?.question?.trim() ? `Soru: ${input.content.question.trim()}` : null,
    "",
    summary,
    "",
    `→ ${url}`,
  ].filter((line) => line !== null);

  return lines.join("\n");
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG oluşturulamadı"))),
      "image/png"
    );
  });
}

/** 9:16 story formatında Kozmik Mesaj paylaşım kartı üretir */
export async function generateShareableCard(
  input: GenerateShareableCardInput
): Promise<ShareableCardAsset> {
  if (typeof document === "undefined") {
    throw new Error("Paylaşım kartı yalnızca tarayıcıda oluşturulabilir");
  }

  const summary = input.executiveSummary.trim();
  if (!summary) {
    throw new Error("Paylaşım için Kozmik Mesaj gerekli");
  }

  const canvas = document.createElement("canvas");
  canvas.width = SOCIAL_CANVAS_WIDTH;
  canvas.height = SOCIAL_CANVAS_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context alınamadı");
  }

  const meta = ORACLE_SHARE_MODULE_META[input.moduleId];
  const accent = meta.accent;
  const icon = input.content?.moduleIcon ?? meta.icon;
  const maxWidth = SOCIAL_CANVAS_WIDTH - SOCIAL_LAYOUT.paddingX * 2;

  drawBackground(ctx);

  ctx.fillStyle = SOCIAL_COLORS.amberMuted;
  ctx.font = "700 28px ui-monospace, monospace";
  ctx.fillText(input.branding?.appName ?? "ASTROTAG", SOCIAL_LAYOUT.paddingX, 88);

  ctx.fillStyle = accent;
  ctx.font = "700 44px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`${icon}  ${input.moduleLabel}`, SOCIAL_LAYOUT.paddingX, 156);

  ctx.fillStyle = SOCIAL_COLORS.textMuted;
  ctx.font = "400 22px ui-monospace, monospace";
  const dateLabel = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  ctx.fillText(dateLabel, SOCIAL_LAYOUT.paddingX, 196);

  let contentY = drawModuleAccent(ctx, input, accent, 248);

  contentY = Math.max(contentY, 360);

  ctx.fillStyle = SOCIAL_COLORS.amberMuted;
  ctx.font = "600 24px ui-monospace, monospace";
  ctx.fillText("KOZMİK MESAJ", SOCIAL_LAYOUT.paddingX, contentY + 24);

  ctx.fillStyle = SOCIAL_COLORS.textPrimary;
  ctx.font = "700 46px ui-sans-serif, system-ui, sans-serif";
  const summaryEndY = wrapText(
    ctx,
    summary,
    SOCIAL_LAYOUT.paddingX,
    contentY + 72,
    maxWidth,
    58,
    8
  );

  if (input.content?.question?.trim()) {
    ctx.fillStyle = SOCIAL_COLORS.textMuted;
    ctx.font = "400 26px ui-sans-serif, system-ui, sans-serif";
    wrapText(
      ctx,
      `Soru: ${input.content.question.trim()}`,
      SOCIAL_LAYOUT.paddingX,
      Math.min(summaryEndY + 28, SOCIAL_CANVAS_HEIGHT - SOCIAL_LAYOUT.footerHeight - 80),
      maxWidth,
      36,
      3
    );
  }

  await drawFooter(ctx, input.branding ?? {});

  const blob = await canvasToBlob(canvas);
  const dataUrl = canvas.toDataURL("image/png");
  const stamp = new Date().toISOString().slice(0, 10);

  return {
    blob,
    dataUrl,
    fileName: `astro-tag-${input.moduleId}-share-${stamp}.png`,
    shareText: buildShareText(input),
  };
}

export function downloadShareableCard(asset: ShareableCardAsset): void {
  const url = URL.createObjectURL(asset.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = asset.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function openShareableCardInNewTab(asset: ShareableCardAsset): void {
  const popup = window.open("", "_blank");
  if (!popup) {
    downloadShareableCard(asset);
    return;
  }

  popup.document.title = "AstroTag · Kozmik Paylaşım";
  popup.document.body.style.margin = "0";
  popup.document.body.style.background = SOCIAL_COLORS.background;
  popup.document.body.style.fontFamily = "system-ui, sans-serif";
  popup.document.body.style.color = "#fff";

  const img = popup.document.createElement("img");
  img.src = asset.dataUrl;
  img.alt = "AstroTag Kozmik Paylaşım Kartı";
  img.style.display = "block";
  img.style.maxWidth = "100%";
  img.style.height = "auto";
  img.style.margin = "0 auto";

  const actions = popup.document.createElement("div");
  actions.style.textAlign = "center";
  actions.style.padding = "20px";

  const link = popup.document.createElement("a");
  link.href = asset.dataUrl;
  link.download = asset.fileName;
  link.textContent = "Görseli indir";
  link.style.color = SOCIAL_COLORS.amber;
  link.style.fontSize = "16px";

  actions.appendChild(link);
  popup.document.body.appendChild(img);
  popup.document.body.appendChild(actions);
}

export type KozmicShareResult = "shared" | "downloaded" | "cancelled" | "failed";

export async function shareGeneratedCard(asset: ShareableCardAsset): Promise<KozmicShareResult> {
  if (typeof navigator !== "undefined" && navigator.share) {
    const file = new File([asset.blob], asset.fileName, { type: "image/png" });

    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "AstroTag · Kozmik Mesaj",
          text: asset.shareText,
          files: [file],
        });
        return "shared";
      }

      await navigator.share({
        title: "AstroTag · Kozmik Mesaj",
        text: asset.shareText,
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  openShareableCardInNewTab(asset);
  return "downloaded";
}

export async function runKozmicShare(input: GenerateShareableCardInput): Promise<{
  result: KozmicShareResult;
  asset: ShareableCardAsset;
}> {
  const asset = await generateShareableCard(input);
  const result = await shareGeneratedCard(asset);
  return { result, asset };
}
