"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_LAYOUT,
  getSocialShareQrUrl,
} from "@/lib/social/constants";
import type { ManifestoStoryContentInput } from "@/lib/manifesto/manifesto-story-layout";
import { drawManifestoStoryContent } from "@/lib/manifesto/manifesto-story-layout";
import { drawManifestoStoryFooter } from "@/lib/manifesto/manifesto-story-card";
import {
  createManifestoStarfield,
  drawManifestoStarfield,
  updateManifestoStarfield,
  type ManifestoStarParticle,
} from "@/lib/manifesto/manifesto-starfield";

export type ManifestoStoryPreviewHandle = {
  /** 1080×1920 PNG — önizleme canvas'ının o anki karesi */
  capturePng: () => Promise<Blob>;
};

type ManifestoStoryPreviewProps = {
  input: ManifestoStoryContentInput;
  className?: string;
};

const ManifestoStoryPreview = forwardRef<
  ManifestoStoryPreviewHandle,
  ManifestoStoryPreviewProps
>(function ManifestoStoryPreview({ input, className = "" }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ManifestoStarParticle[] | null>(null);
  const qrRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    capturePng: async () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Önizleme hazır değil");
      }

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Ekran görüntüsü oluşturulamadı"));
            }
          },
          "image/png"
        );
      });
    },
  }));

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
});

export default ManifestoStoryPreview;
