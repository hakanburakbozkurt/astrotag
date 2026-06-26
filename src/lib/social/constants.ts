/** Dikey story / Reels / TikTok formatı */
export const SOCIAL_CANVAS_WIDTH = 1080;
export const SOCIAL_CANVAS_HEIGHT = 1920;

export const SOCIAL_BRAND_DOMAIN = "astro-tag.app";
export const SOCIAL_BRAND_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://astro-tag.app";

export const SOCIAL_COLORS = {
  background: "#0a0f1a",
  grid: "rgba(255,255,255,0.03)",
  amber: "#fbbf24",
  amberMuted: "rgba(251,191,36,0.65)",
  textPrimary: "rgba(255,255,255,0.92)",
  textSecondary: "rgba(255,255,255,0.62)",
  textMuted: "rgba(255,255,255,0.38)",
  cyan: "#67e8f9",
} as const;

export const SOCIAL_LAYOUT = {
  paddingX: 72,
  paddingTop: 96,
  chartSize: 760,
  chartTop: 280,
  footerHeight: 220,
  qrSize: 128,
} as const;

export const SOCIAL_VIDEO = {
  fps: 30,
  minDurationMs: 5000,
  maxDurationMs: 10000,
  brandCardDurationMs: 2000,
  defaultDurationMs: 8000,
  mimeType: "video/webm;codecs=vp9",
  fileExtension: "webm",
} as const;

export function getSocialShareQrUrl(size = SOCIAL_LAYOUT.qrSize): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(SOCIAL_BRAND_URL)}&bgcolor=0a0f1a&color=fbbf24`;
}
