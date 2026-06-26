export function typingEffectText(fullText: string, progress: number): string {
  const clamped = Math.min(1, Math.max(0, progress));
  const length = Math.floor(fullText.length * clamped);
  return fullText.slice(0, length);
}

export function typingProgressForFrame(
  frameIndex: number,
  totalFrames: number,
  startRatio = 0.35,
  endRatio = 0.85
): number {
  const t = frameIndex / Math.max(1, totalFrames - 1);
  if (t <= startRatio) return 0;
  if (t >= endRatio) return 1;
  return (t - startRatio) / (endRatio - startRatio);
}
