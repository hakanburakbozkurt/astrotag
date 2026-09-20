export const FEED_CONTEXT_TAGS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
  "transit",
  "retrograde",
  "new_moon",
  "full_moon",
  "dream",
  "tarot_reflection",
  "manifestation",
  "synastry_note",
  "horary",
  "intuition",
  "ritual",
  "general_cosmic",
] as const;

export type FeedContextTag = (typeof FEED_CONTEXT_TAGS)[number];

const TAG_LABELS: Record<FeedContextTag, string> = {
  aries: "Koç",
  taurus: "Boğa",
  gemini: "İkizler",
  cancer: "Yengeç",
  leo: "Aslan",
  virgo: "Başak",
  libra: "Terazi",
  scorpio: "Akrep",
  sagittarius: "Yay",
  capricorn: "Oğlak",
  aquarius: "Kova",
  pisces: "Balık",
  transit: "Transit",
  retrograde: "Retrograd",
  new_moon: "Yeni Ay",
  full_moon: "Dolunay",
  dream: "Rüya",
  tarot_reflection: "Tarot Yansıması",
  manifestation: "Manifestasyon",
  synastry_note: "Synastry Notu",
  horary: "Horary",
  intuition: "Sezgi",
  ritual: "Ritüel",
  general_cosmic: "Kozmik Düşünce",
};

export function isFeedContextTag(value: string): value is FeedContextTag {
  return (FEED_CONTEXT_TAGS as readonly string[]).includes(value);
}

export function feedContextTagLabel(tag: FeedContextTag | string): string {
  if (isFeedContextTag(tag)) {
    return TAG_LABELS[tag];
  }
  return tag;
}

export const FEED_MAX_CAPTION_LENGTH = 280;
export const FEED_MAX_REPLY_LENGTH = 280;
export const USER_DAILY_POST_LIMIT = 3;
