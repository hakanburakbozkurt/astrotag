"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface UseSalesScrollParallaxOptions {
  mobileFactor?: number;
  desktopFactor?: number;
}

export function useSalesScrollParallax({
  mobileFactor = 0.1,
  desktopFactor = 0.22,
}: UseSalesScrollParallaxOptions = {}) {
  const reducedMotion = usePrefersReducedMotion();
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setOffsetY(0);
      return;
    }

    let rafId = 0;
    let latestScroll = 0;

    const apply = () => {
      rafId = 0;
      const isMobile = window.innerWidth < 768;
      const factor = isMobile ? mobileFactor : desktopFactor;
      setOffsetY(latestScroll * factor);
    };

    const onScroll = () => {
      latestScroll = window.scrollY;
      if (!rafId) {
        rafId = window.requestAnimationFrame(apply);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [desktopFactor, mobileFactor, reducedMotion]);

  return offsetY;
}
