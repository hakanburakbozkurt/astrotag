"use client";

import { useEffect, useRef } from "react";
import {
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_LAYOUT,
  getSocialShareQrUrl,
} from "@/lib/social/constants";
import type { ManifestoStoryCardInput } from "@/lib/manifesto/manifesto-story-card";
import {
  drawManifestoStoryFooter,
  drawManifestoStoryContent,
} from "@/lib/manifesto/manifesto-story-card";
import {
  createManifestoStarfield,
  drawManifestoStarfield,
  updateManifestoStarfield,
  type ManifestoStarParticle,
} from "@/lib/manifesto/manifesto-starfield";

type ManifestoStoryPreviewProps = {
  input: ManifestoStoryCardInput;
  className?: string;
};

export default function ManifestoStoryPreview({
  input,
  className = "",
}: ManifestoStoryPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ManifestoStarParticle[] | null>(null);
  const qrRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    particlesRef.current = createManifestoStarfield(72);

    const qr = new Image();
    qr.crossOrigin = "anonymous";
    qr.onload = () => {
      qrRef.current = qr;
    };
    qr.src = getSocialShareQrUrl(SOCIAL_LAYOUT.qrSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    if (!particlesRef.current) {
      particlesRef.current = createManifestoStarfield(72);
    }

    const particles = particlesRef.current;
    let start = performance.now();

    const tick = (now: number) => {
      updateManifestoStarfield(particles);
      drawManifestoStarfield(
        ctx,
        particles,
        SOCIAL_CANVAS_WIDTH,
        SOCIAL_CANVAS_HEIGHT,
        now - start
      );
      drawManifestoStoryContent(ctx, input);
      void drawManifestoStoryFooter(ctx, qrRef.current);

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [input]);

  return (
    <canvas
      ref={canvasRef}
      width={SOCIAL_CANVAS_WIDTH}
      height={SOCIAL_CANVAS_HEIGHT}
      aria-label="Manifesto story önizlemesi"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
