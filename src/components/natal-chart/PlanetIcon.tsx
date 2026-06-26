import type { ReactNode } from "react";
import type { PlanetId } from "@/lib/astrology/types";

interface PlanetIconProps {
  id: PlanetId;
  size?: number;
  className?: string;
}

const ICONS: Record<PlanetId, (size: number) => ReactNode> = {
  sun: (size) => (
    <circle cx={size / 2} cy={size / 2} r={size * 0.28} fill="currentColor" />
  ),
  moon: (size) => (
    <path
      d={`M${size * 0.62} ${size * 0.18} A${size * 0.3} ${size * 0.3} 0 1 1 ${size * 0.38} ${size * 0.82} A${size * 0.22} ${size * 0.22} 0 1 0 ${size * 0.62} ${size * 0.18}`}
      fill="currentColor"
    />
  ),
  mercury: (size) => (
    <>
      <circle cx={size / 2} cy={size * 0.36} r={size * 0.16} fill="currentColor" />
      <path
        d={`M${size * 0.35} ${size * 0.72} L${size * 0.5} ${size * 0.52} L${size * 0.65} ${size * 0.72}`}
        stroke="currentColor"
        strokeWidth={size * 0.08}
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  venus: (size) => (
    <>
      <circle cx={size / 2} cy={size * 0.34} r={size * 0.16} fill="currentColor" />
      <path
        d={`M${size * 0.5} ${size * 0.5} L${size * 0.5} ${size * 0.82} M${size * 0.36} ${size * 0.66} L${size * 0.64} ${size * 0.66}`}
        stroke="currentColor"
        strokeWidth={size * 0.08}
        strokeLinecap="round"
      />
    </>
  ),
  mars: (size) => (
    <>
      <circle cx={size / 2} cy={size * 0.34} r={size * 0.16} fill="currentColor" />
      <path
        d={`M${size * 0.58} ${size * 0.58} L${size * 0.78} ${size * 0.38} M${size * 0.78} ${size * 0.38} L${size * 0.68} ${size * 0.38} M${size * 0.78} ${size * 0.38} L${size * 0.78} ${size * 0.48}`}
        stroke="currentColor"
        strokeWidth={size * 0.08}
        strokeLinecap="round"
      />
    </>
  ),
  jupiter: (size) => (
    <path
      d={`M${size * 0.34} ${size * 0.72} Q${size * 0.5} ${size * 0.2} ${size * 0.66} ${size * 0.72}`}
      stroke="currentColor"
      strokeWidth={size * 0.1}
      fill="none"
      strokeLinecap="round"
    />
  ),
  saturn: (size) => (
    <>
      <ellipse
        cx={size / 2}
        cy={size * 0.42}
        rx={size * 0.28}
        ry={size * 0.08}
        stroke="currentColor"
        strokeWidth={size * 0.06}
        fill="none"
      />
      <circle cx={size / 2} cy={size * 0.42} r={size * 0.16} fill="currentColor" />
    </>
  ),
};

export default function PlanetIcon({
  id,
  size = 24,
  className = "text-amber-200",
}: PlanetIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      {ICONS[id](size)}
    </svg>
  );
}
