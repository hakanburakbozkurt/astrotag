"use client";

import { memo, useEffect, useLayoutEffect, useRef } from "react";
import { MANIFESTO_NEBULA_VIDEO_SRC } from "@/components/home/manifesto/manifesto-portal.constants";
import type { NebulaPortalPhase } from "@/components/home/manifesto/manifesto-portal.constants";

interface ManifestoPortalVideoProps {
  phase: NebulaPortalPhase;
}

function ManifestoPortalVideoInner({ phase }: ManifestoPortalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const visible = phase === "idle" || phase === "playing";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || phase !== "idle") {
      return;
    }

    video.loop = true;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  }, [phase]);

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!video || phase !== "playing") {
      return;
    }

    video.loop = false;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  }, [phase]);

  return (
    <video
      ref={videoRef}
      src={MANIFESTO_NEBULA_VIDEO_SRC}
      muted
      playsInline
      autoPlay
      preload="auto"
      aria-hidden
      className={`absolute inset-[6%] z-[3] h-[88%] w-[88%] object-contain mix-blend-screen contrast-[1.05] brightness-[1.08] saturate-[0.75] transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

export default memo(ManifestoPortalVideoInner);
