"use client";

/** Referans tarot kartındaki altın astroloji mührü */
export default function CelestialSealGraphic({ className ="" }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 240 200"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden
 >
 <defs>
 <linearGradient id="seal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#f5e6c8" />
 <stop offset="45%" stopColor="#d4af37" />
 <stop offset="100%" stopColor="#9a7b2e" />
 </linearGradient>
 </defs>

 <circle cx="120" cy="108" r="78" stroke="url(#seal-gold)" strokeWidth="0.6" opacity="0.55" />
 <circle cx="120" cy="108" r="62" stroke="url(#seal-gold)" strokeWidth="0.5" opacity="0.45" />
 <circle cx="120" cy="108" r="46" stroke="url(#seal-gold)" strokeWidth="0.45" opacity="0.5" />

 {Array.from({ length: 12 }).map((_, i) => {
 const angle = (i * Math.PI) / 6 - Math.PI / 2;
 const x1 = 120 + Math.cos(angle) * 48;
 const y1 = 108 + Math.sin(angle) * 48;
 const x2 = 120 + Math.cos(angle) * 72;
 const y2 = 108 + Math.sin(angle) * 72;
 return (
 <line
 key={`ray-${i}`}
 x1={x1}
 y1={y1}
 x2={x2}
 y2={y2}
 stroke="url(#seal-gold)"
 strokeWidth="0.45"
 opacity="0.42"
 />
 );
 })}

 <path
 d="M120 58 C108 72 96 88 96 104 C96 118 106 128 120 128 C134 128 144 118 144 104 C144 88 132 72 120 58Z"
 stroke="url(#seal-gold)"
 strokeWidth="0.65"
 opacity="0.7"
 />
 <path
 d="M120 128 C108 142 96 158 96 174 C96 188 106 198 120 198 C134 198 144 188 144 174 C144 158 132 142 120 128Z"
 fill="url(#seal-gold)"
 opacity="0.22"
 />

 <circle cx="120" cy="108" r="14" stroke="url(#seal-gold)" strokeWidth="0.55" opacity="0.65" />
 <circle cx="120" cy="108" r="4" fill="url(#seal-gold)" opacity="0.85" />

 <ellipse
 cx="120"
 cy="108"
 rx="34"
 ry="12"
 stroke="url(#seal-gold)"
 strokeWidth="0.4"
 opacity="0.35"
 transform="rotate(-18 120 108)"
 />
 <ellipse
 cx="120"
 cy="108"
 rx="34"
 ry="12"
 stroke="url(#seal-gold)"
 strokeWidth="0.4"
 opacity="0.35"
 transform="rotate(24 120 108)"
 />

 <path
 d="M48 108 Q84 78 120 88 Q156 78 192 108"
 stroke="url(#seal-gold)"
 strokeWidth="0.4"
 opacity="0.3"
 />
 <path
 d="M52 124 Q88 148 120 138 Q152 148 188 124"
 stroke="url(#seal-gold)"
 strokeWidth="0.35"
 opacity="0.28"
 />

 <circle cx="72" cy="92" r="2" fill="url(#seal-gold)" opacity="0.55" />
 <circle cx="168" cy="92" r="2" fill="url(#seal-gold)" opacity="0.55" />
 <circle cx="64" cy="128" r="1.5" fill="url(#seal-gold)" opacity="0.45" />
 <circle cx="176" cy="128" r="1.5" fill="url(#seal-gold)" opacity="0.45" />
 </svg>
 );
}
