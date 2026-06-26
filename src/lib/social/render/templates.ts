import type { SocialSharePayload } from "../types";
import {
  drawBodyBlock,
  drawBrandFooter,
  drawChartImage,
  drawHeaderBlock,
  drawScoreBadge,
  drawSocialBackground,
} from "./canvas-layout";
import { SOCIAL_CANVAS_HEIGHT, SOCIAL_CANVAS_WIDTH, SOCIAL_LAYOUT } from "../constants";

export async function renderShareTemplate(
  ctx: CanvasRenderingContext2D,
  payload: SocialSharePayload,
  chartDataUrl: string
): Promise<void> {
  drawSocialBackground(ctx);
  drawHeaderBlock(ctx, payload);

  const chartCenterX = SOCIAL_CANVAS_WIDTH / 2;
  const chartCenterY = SOCIAL_LAYOUT.chartTop + SOCIAL_LAYOUT.chartSize / 2;

  if (payload.score) {
    drawScoreBadge(ctx, payload.score, SOCIAL_LAYOUT.paddingX, SOCIAL_LAYOUT.chartTop - 20);
  }

  await drawChartImage(
    ctx,
    chartDataUrl,
    chartCenterX,
    chartCenterY,
    SOCIAL_LAYOUT.chartSize
  );

  const bodyStartY = chartCenterY + SOCIAL_LAYOUT.chartSize / 2 + 48;
  drawBodyBlock(ctx, payload, bodyStartY);

  await drawBrandFooter(ctx);
}

export async function renderBrandCardFrame(ctx: CanvasRenderingContext2D): Promise<void> {
  drawSocialBackground(ctx);

  ctx.fillStyle = "rgba(251,191,36,0.95)";
  ctx.font = "700 72px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("astro-tag.app", SOCIAL_CANVAS_WIDTH / 2, SOCIAL_CANVAS_HEIGHT / 2 - 24);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "400 32px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Kişisel astroloji pusulan", SOCIAL_CANVAS_WIDTH / 2, SOCIAL_CANVAS_HEIGHT / 2 + 36);
  ctx.textAlign = "left";

  await drawBrandFooter(ctx);
}
