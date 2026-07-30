import {
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_COLORS,
  SOCIAL_LAYOUT,
} from "@/lib/social/constants";

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

/** Story kart tipografi — preview ve video render aynı sabitleri kullanır */
export const MANIFESTO_STORY_LAYOUT = {
  headerTop: 108,
  headerGap: 38,
  dividerGap: 28,
  contentPadBottom: 72,
  cycleLabelOffset: 52,
  hookFont: "italic 400 36px ui-serif, Georgia, serif",
  hookLineHeight: 56,
  hookMaxLines: 5,
  claimFont: "700 48px ui-serif, Georgia, serif",
  claimLineHeight: 68,
  claimMaxLines: 6,
  mainBlockGap: 56,
  eyebrowFont: "600 26px ui-sans-serif, system-ui, sans-serif",
  categoryFont: "500 22px ui-sans-serif, system-ui, sans-serif",
  userNameFont: "400 24px ui-sans-serif, system-ui, sans-serif",
  cycleFont: "500 22px ui-monospace, monospace",
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

  ctx.textAlign = "left";
  return y;
}

function measureHeaderHeight(input: ManifestoStoryContentInput): number {
  let height = MANIFESTO_STORY_LAYOUT.headerTop + 34;
  if (input.categoryLabel) {
    height += MANIFESTO_STORY_LAYOUT.headerGap;
  }
  if (input.userName?.trim()) {
    height += MANIFESTO_STORY_LAYOUT.headerGap;
  }
  height += MANIFESTO_STORY_LAYOUT.dividerGap + 12;
  return height;
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

  const pad = SOCIAL_LAYOUT.paddingX;
  const maxWidth = SOCIAL_CANVAS_WIDTH - pad * 2;
  const centerX = SOCIAL_CANVAS_WIDTH / 2;

  // —— Header (üst, ortalanmış) ——
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
  ctx.strokeStyle = "rgba(251,191,36,0.28)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad + 40, headerY);
  ctx.lineTo(SOCIAL_CANVAS_WIDTH - pad - 40, headerY);
  ctx.stroke();

  // —— Ana metin bloğu (dikey + yatay ortalı) ——
  const contentTop = measureHeaderHeight(input) + 36;
  const contentBottom =
    SOCIAL_CANVAS_HEIGHT - SOCIAL_LAYOUT.footerHeight - MANIFESTO_STORY_LAYOUT.contentPadBottom;
  const contentHeight = contentBottom - contentTop;

  ctx.font = MANIFESTO_STORY_LAYOUT.hookFont;
  const hookLines = breakLines(
    ctx,
    input.presentation.cosmicHook,
    maxWidth,
    MANIFESTO_STORY_LAYOUT.hookMaxLines
  );

  ctx.font = MANIFESTO_STORY_LAYOUT.claimFont;
  const claimText = `"${input.presentation.manifestoClaim}"`;
  const claimLines = breakLines(
    ctx,
    claimText,
    maxWidth,
    MANIFESTO_STORY_LAYOUT.claimMaxLines
  );

  const hookBlockHeight = hookLines.length * MANIFESTO_STORY_LAYOUT.hookLineHeight;
  const claimBlockHeight = claimLines.length * MANIFESTO_STORY_LAYOUT.claimLineHeight;
  const totalMainHeight =
    hookBlockHeight + MANIFESTO_STORY_LAYOUT.mainBlockGap + claimBlockHeight;

  let mainStartY = contentTop + Math.max(0, (contentHeight - totalMainHeight) / 2);
  mainStartY += MANIFESTO_STORY_LAYOUT.hookLineHeight * 0.82;

  ctx.fillStyle = SOCIAL_COLORS.textSecondary;
  ctx.font = MANIFESTO_STORY_LAYOUT.hookFont;
  const afterHookY = drawCenteredLines(
    ctx,
    hookLines,
    centerX,
    mainStartY,
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

  // —— Döngü etiketi (alt, ortalanmış) ——
  if (input.cycleLabel) {
    ctx.fillStyle = SOCIAL_COLORS.textMuted;
    ctx.font = MANIFESTO_STORY_LAYOUT.cycleFont;
    ctx.textAlign = "center";
    ctx.fillText(
      input.cycleLabel,
      centerX,
      SOCIAL_CANVAS_HEIGHT - SOCIAL_LAYOUT.footerHeight - MANIFESTO_STORY_LAYOUT.cycleLabelOffset
    );
  }

  ctx.textAlign = "left";
  ctx.restore();
}
