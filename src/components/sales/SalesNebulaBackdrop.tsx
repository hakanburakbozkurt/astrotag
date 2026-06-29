"use client";

import { useSalesScrollParallax } from "@/hooks/useSalesScrollParallax";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export default function SalesNebulaBackdrop() {
  const offsetY = useSalesScrollParallax({ mobileFactor: 0.08, desktopFactor: 0.2 });
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden"
    >
      <div
        className="sales-nebula-parallax absolute inset-0 will-change-transform"
        style={
          reducedMotion
            ? undefined
            : { transform: `translate3d(0, ${offsetY}px, 0)` }
        }
      >
        <div className="absolute -left-1/4 top-[8%] h-[55vmin] w-[55vmin] rounded-full bg-violet-700/10 blur-3xl" />
        <div className="absolute -right-1/4 top-[32%] h-[48vmin] w-[48vmin] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-1/3 top-[58%] h-[42vmin] w-[42vmin] -translate-x-1/2 rounded-full bg-amber-500/[0.07] blur-3xl" />
      </div>
    </div>
  );
}
