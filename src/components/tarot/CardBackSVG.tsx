"use client";

import { useId } from "react";

interface CardBackSVGProps {
  className?: string;
}

export default function CardBackSVG({ className = "h-full w-full" }: CardBackSVGProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 240 420"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`tarotBg-${uid}`} cx="50%" cy="42%" r="72%">
          <stop offset="0%" stopColor="#141c32" />
          <stop offset="55%" stopColor="#0a0e1a" />
          <stop offset="100%" stopColor="#05070f" />
        </radialGradient>
        <linearGradient id={`tarotGold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0d78c" />
          <stop offset="45%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#7a5a18" />
        </linearGradient>
        <linearGradient id={`tarotGoldSoft-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#e8c872" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8b6914" stopOpacity="0.15" />
        </linearGradient>
        <symbol id={`tarotCornerStar-${uid}`} viewBox="-6 -6 12 12">
          <path
            d="M0 -5.2 L1.3 -1.3 L5.2 0 L1.3 1.3 L0 5.2 L-1.3 1.3 L-5.2 0 L-1.3 -1.3 Z"
            fill={`url(#tarotGold-${uid})`}
          />
        </symbol>
        <path
          id={`tarotCrescent-${uid}`}
          d="M 0 -18 C 10 -18 18 -10 18 0 C 18 10 10 18 0 18 C 6 12 9 6 9 0 C 9 -6 6 -12 0 -18 Z"
          fill={`url(#tarotGold-${uid})`}
          opacity="0.85"
        />
      </defs>

      <rect width="240" height="420" fill={`url(#tarotBg-${uid})`} />

      <rect
        x="14"
        y="14"
        width="212"
        height="392"
        rx="14"
        ry="14"
        fill="none"
        stroke={`url(#tarotGold-${uid})`}
        strokeWidth="1.4"
      />
      <rect
        x="26"
        y="26"
        width="188"
        height="368"
        rx="10"
        ry="10"
        fill="none"
        stroke={`url(#tarotGold-${uid})`}
        strokeWidth="0.6"
        opacity="0.5"
      />

      <use href={`#tarotCornerStar-${uid}`} x="28" y="28" width="10" height="10" />
      <use href={`#tarotCornerStar-${uid}`} x="202" y="28" width="10" height="10" />
      <use href={`#tarotCornerStar-${uid}`} x="28" y="382" width="10" height="10" />
      <use href={`#tarotCornerStar-${uid}`} x="202" y="382" width="10" height="10" />

      <circle cx="120" cy="210" r="78" fill="none" stroke={`url(#tarotGoldSoft-${uid})`} strokeWidth="0.8" />
      <circle cx="120" cy="210" r="62" fill="none" stroke={`url(#tarotGold-${uid})`} strokeWidth="0.5" opacity="0.35" />
      <circle cx="120" cy="210" r="46" fill="none" stroke={`url(#tarotGold-${uid})`} strokeWidth="0.4" opacity="0.25" />

      {Array.from({ length: 12 }).map((_, index) => {
        const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
        const x1 = 120 + Math.cos(angle) * 48;
        const y1 = 210 + Math.sin(angle) * 48;
        const x2 = 120 + Math.cos(angle) * 58;
        const y2 = 210 + Math.sin(angle) * 58;
        return (
          <line
            key={`mandala-${index}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={`url(#tarotGold-${uid})`}
            strokeWidth="0.6"
            opacity="0.4"
          />
        );
      })}

      <g transform="translate(120 210)">
        <path
          d="M 0 -72 L 14 -14 L 72 0 L 14 14 L 0 72 L -14 14 L -72 0 L -14 -14 Z"
          fill={`url(#tarotGold-${uid})`}
        />
        <path d="M 0 -72 L 0 72" stroke="#0a0e1a" strokeWidth="1.1" opacity="0.55" />
        <path d="M -72 0 L 72 0" stroke="#0a0e1a" strokeWidth="1.1" opacity="0.55" />
        <path d="M -51 -51 L 51 51" stroke="#0a0e1a" strokeWidth="0.8" opacity="0.45" />
        <path d="M 51 -51 L -51 51" stroke="#0a0e1a" strokeWidth="0.8" opacity="0.45" />
        <circle r="8" fill="#0a0e1a" stroke={`url(#tarotGold-${uid})`} strokeWidth="1" />
      </g>

      <use href={`#tarotCrescent-${uid}`} transform="translate(120 88)" />
      <use href={`#tarotCrescent-${uid}`} transform="translate(120 332) rotate(180)" />

      <g opacity="0.55">
        {[
          [52, 128],
          [188, 128],
          [52, 292],
          [188, 292],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill={`url(#tarotGold-${uid})`} />
        ))}
      </g>
    </svg>
  );
}
