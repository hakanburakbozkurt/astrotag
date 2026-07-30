import {
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_COLORS,
  SOCIAL_LAYOUT,
} from "@/lib/social/constants";

/** Layout sürümü — preview/video senkron doğrulama */
export const MANIFESTO_STORY_LAYOUT_VERSION = 2;

/** Story kart çizim girdisi — preview ve video render ortak tip */
export type ManifestoStoryContentInput = {
  presentation: {
    cosmicHook: string;
    manifestoClaim: string;
  };
  userName?: string;
  categoryLabel?: string;
  cycleLabel?: string;
};

/**
 * Story kart tipografi v2 — ana metin kartın geometrik merkezinde,
 * büyük font ve geniş satır aralığı ile alanı doldurur.
 */
export const MANIFESTO_STORY_LAYOUT = {
  /** Kompakt üst meta — ana metne alan bırakır */
  headerTop: 96,
  headerGap: 32,
  dividerGap: 24,
  contentPadBottom: 64,
  cycleLabelOffset: 48,
  /** Ana metin — v2 büyük tipografi */
  hookFont: "italic 400 44px ui-serif, Georgia, serif",
  hookLineHeight: 68,
  hookMaxLines: 5,
  claimFont: "700 58px ui-serif, Georgia, serif",
  claimLineHeight: 84,
  claimMaxLines: 5,
  mainBlockGap: 72,
  /** Üst meta — küçük tutulur */
  eyebrowFont: "600 24px ui-sans-serif, system-ui, sans-serif",
  categoryFont: "500 20px ui-sans-serif, system-ui, sans-serif",
  userNameFont: "400 22px ui-sans-serif, system-ui, sans-serif",
  cycleFont: "500 22px ui-monospace, monospace",
  /** Metin bloğu dikey ortalama bandı (footer üstüne kadar) */
  mainBandTop: 248,
  mainBandBottomOffset: 300,
} as const;

function breakLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines?: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (maxLines && lines.length >= maxLines) {
        return lines;
      }
    } else {
      line = testLine;
    }
  }

  if (line && (!maxLines || lines.length < maxLines)) {
    lines.push(line);
  }

  return lines;
}

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  centerX: number,
  startY: number,
  lineHeight: number
): number {
  let y = startY;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  for (const line of lines) {
    ctx.fillText(line, centerX, y);
    y += lineHeight;
  }

  return y;
}

function measureHeaderBottom(input: ManifestoStoryContentInput): number {
  let y = MANIFESTO_STORY_LAYOUT.headerTop + 28;
  if (input.categoryLabel) {
    y += MANIFESTO_STORY_LAYOUT.headerGap;
  }
  if (input.userName?.trim()) {
    y += MANIFESTO_STORY_LAYOUT.headerGap;
  }
  y += MANIFESTO_STORY_LAYOUT.dividerGap + 8;
  return y;
}

export function drawManifestoStoryContent(
  ctx: CanvasRenderingContext2D,
  input: ManifestoStoryContentInput,
  options?: { contentAlpha?: number }
): void {
  const alpha = options?.contentAlpha ?? 1;
  if (alpha <= 0) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  const horizontalPad = 56;
  const maxWidth = SOCIAL_CANVAS_WIDTH - horizontalPad * 2;
  const centerX = SOCIAL_CANVAS_WIDTH / 2;

  // —— Kompakt header (üst, ortalı) ——
  let headerY = MANIFESTO_STORY_LAYOUT.headerTop;

  ctx.fillStyle = SOCIAL_COLORS.amberMuted;
  ctx.font = MANIFESTO_STORY_LAYOUT.eyebrowFont;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("GÜNLÜK KOZMİK MANİFESTO", centerX, headerY);

  if (input.categoryLabel) {
    headerY += MANIFESTO_STORY_LAYOUT.headerGap;
    ctx.fillStyle = SOCIAL_COLORS.textMuted;
    ctx.font = MANIFESTO_STORY_LAYOUT.categoryFont;
    ctx.fillText(input.categoryLabel.toUpperCase(), centerX, headerY);
  }

  if (input.userName?.trim()) {
    headerY += MANIFESTO_STORY_LAYOUT.headerGap;
    ctx.fillStyle = SOCIAL_COLORS.textSecondary;
    ctx.font = MANIFESTO_STORY_LAYOUT.userNameFont;
    ctx.fillText(input.userName.trim(), centerX, headerY);
  }

  headerY += MANIFESTO_STORY_LAYOUT.dividerGap;
  ctx.strokeStyle = "rgba(251,191,36,0.32)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(horizontalPad + 24, headerY);
  ctx.lineTo(SOCIAL_CANVAS_WIDTH - horizontalPad - 24, headerY);
  ctx.stroke();

  // —— Ana metin: kartın dikey merkez bandında geometrik ortalama ——
  const bandTop = Math.max(
    measureHeaderBottom(input) + 32,
    MANIFESTO_STORY_LAYOUT.mainBandTop
  );
  const bandBottom =
    SOCIAL_CANVAS_HEIGHT -
    SOCIAL_LAYOUT.footerHeight -
    MANIFESTO_STORY_LAYOUT.mainBandBottomOffset;
  const bandMidY = (bandTop + bandBottom) / 2;

  ctx.font = MANIFESTO_STORY_LAYOUT.hookFont;
  const hookLines = breakLines(
    ctx,
    input.presentation.cosmicHook,
    maxWidth,
    MANIFESTO_STORY_LAYOUT.hookMaxLines
  );

  ctx.font = MANIFESTO_STORY_LAYOUT.claimFont;
  const claimLines = breakLines(
    ctx,
    `"${input.presentation.manifestoClaim}"`,
    maxWidth,
    MANIFESTO_STORY_LAYOUT.claimMaxLines
  );

  const hookBlockHeight =
    hookLines.length * MANIFESTO_STORY_LAYOUT.hookLineHeight;
  const claimBlockHeight =
    claimLines.length * MANIFESTO_STORY_LAYOUT.claimLineHeight;
  const totalMainHeight =
    hookBlockHeight + MANIFESTO_STORY_LAYOUT.mainBlockGap + claimBlockHeight;

  const blockTopY = bandMidY - totalMainHeight / 2;
  const hookStartY = blockTopY + MANIFESTO_STORY_LAYOUT.hookLineHeight * 0.78;

  ctx.fillStyle = SOCIAL_COLORS.textSecondary;
  ctx.font = MANIFESTO_STORY_LAYOUT.hookFont;
  const afterHookY = drawCenteredLines(
    ctx,
    hookLines,
    centerX,
    hookStartY,
    MANIFESTO_STORY_LAYOUT.hookLineHeight
  );

  ctx.fillStyle = SOCIAL_COLORS.amber;
  ctx.font = MANIFESTO_STORY_LAYOUT.claimFont;
  drawCenteredLines(
    ctx,
    claimLines,
    centerX,
    afterHookY + MANIFESTO_STORY_LAYOUT.mainBlockGap,
    MANIFESTO_STORY_LAYOUT.claimLineHeight
  );

  if (input.cycleLabel) {
    ctx.fillStyle = SOCIAL_COLORS.textMuted;
    ctx.font = MANIFESTO_STORY_LAYOUT.cycleFont;
    ctx.textAlign = "center";
    ctx.fillText(
      input.cycleLabel,
      centerX,
      SOCIAL_CANVAS_HEIGHT -
        SOCIAL_LAYOUT.footerHeight -
        MANIFESTO_STORY_LAYOUT.cycleLabelOffset
    );
  }

  ctx.textAlign = "left";
  ctx.restore();
}
