import { SITE_URL } from "@/lib/nfc/constants";
import type { CosmicRadarSharePayload } from "@/lib/cosmic-radar/types";
import { ZODIAC_GLYPHS } from "@/lib/astrology/zodiac-signs";

export function buildCosmicRadarShareText(payload: CosmicRadarSharePayload): string {
  const glyph = ZODIAC_GLYPHS[payload.sign];
  return [
    "✦ AstroTag · Haftalık Analiz",
    payload.weekLabel,
    `${glyph} ${payload.sign}`,
    "",
    payload.cardTitle,
    payload.cardBody,
    "",
    `→ ${SITE_URL}`,
  ].join("\n");
}

export function getCosmicRadarQrUrl(size = 96): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(SITE_URL)}&bgcolor=0a0f1a&color=fbbf24`;
}
