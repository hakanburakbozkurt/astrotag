import type { SocialShareAspectStroke } from "../types";
import { SOCIAL_COLORS } from "../constants";

export function drawAspectStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: SocialShareAspectStroke[],
  globalProgress: number
): void {
  for (const stroke of strokes) {
    const progress = Math.min(1, Math.max(0, stroke.progress ?? globalProgress));
    if (progress <= 0) continue;

    const x = stroke.x1 + (stroke.x2 - stroke.x1) * progress;
    const y = stroke.y1 + (stroke.y2 - stroke.y1) * progress;

    ctx.beginPath();
    ctx.moveTo(stroke.x1, stroke.y1);
    ctx.lineTo(x, y);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

export function defaultAspectStrokeProgress(
  frameIndex: number,
  totalFrames: number,
  aspectIndex: number,
  aspectCount: number
): number {
  const slot = 1 / aspectCount;
  const start = aspectIndex * slot * 0.55;
  const end = start + slot * 0.55;
  const t = frameIndex / Math.max(1, totalFrames - 1);
  if (t <= start) return 0;
  if (t >= end) return 1;
  return (t - start) / (end - start);
}

export function aspectColor(type: string): string {
  switch (type) {
    case "trine":
      return "rgba(59,130,246,0.85)";
    case "square":
      return "rgba(239,68,68,0.85)";
    case "opposition":
      return "rgba(168,85,247,0.85)";
    default:
      return SOCIAL_COLORS.amber;
  }
}
