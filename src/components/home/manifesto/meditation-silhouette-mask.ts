/** Meditasyon silüeti — CSS mask-image için inline SVG */
export const MEDITATION_SILHOUETTE_MASK = `url("data:image/svg+xml,${encodeURIComponent(
 `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 160' fill='white'>
 <ellipse cx='60' cy='28' rx='16' ry='18'/>
 <path d='M38 52c-6 8-10 22-8 36 2 14 8 28 18 38 6 6 12 10 12 10s6-4 12-10c10-10 16-24 18-38 2-14-2-28-8-36-8-10-22-14-22-14s-14 4-22 14Z'/>
 <path d='M22 98c-8 6-14 16-16 28-2 10 4 18 14 18h76c10 0 16-8 14-18-2-12-8-22-16-28-10-8-24-12-36-12s-26 4-36 12Z'/>
 <path d='M28 132c-4 8-2 18 6 22 8 4 18 0 22-8 2-4 2-8 0-12M92 132c4 8 2 18-6 22-8 4-18 0-22-8-2-4-2-8 0-12' opacity='0.85'/>
 </svg>`
)}")`;

export const NEBULA_TEXTURE_STYLE = {
 backgroundImage: ["radial-gradient(circle at 22% 28%, rgba(167,139,250,0.95) 0%, transparent 42%)","radial-gradient(circle at 78% 22%, rgba(56,189,248,0.85) 0%, transparent 38%)","radial-gradient(circle at 52% 68%, rgba(99,102,241,0.9) 0%, transparent 45%)","radial-gradient(circle at 30% 78%, rgba(236,72,153,0.55) 0%, transparent 40%)","linear-gradient(165deg, #1e1b4b 0%, #312e81 35%, #4c1d95 68%, #0f172a 100%)",
 ].join(","),
 backgroundSize:"180% 180%, 160% 160%, 200% 200%, 150% 150%, 100% 100%",
} as const;
