export const TAROT_SPREAD_POSITIONS = ["Sol", "Orta", "Sağ"] as const;

export type TarotSpreadPosition = (typeof TAROT_SPREAD_POSITIONS)[number];

export interface TarotShareCard {
  name: string;
  position: TarotSpreadPosition;
}

export interface TarotSharePayload {
  question: string;
  cards: TarotShareCard[];
  reading: string;
}

function cardSpreadLine(cards: TarotShareCard[]): string {
  return cards.map((card) => `${card.position}: ${card.name}`).join("\n");
}

function readingExcerpt(reading: string, maxLength: number): string {
  const trimmed = reading.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export function buildInstagramStoryText(payload: TarotSharePayload): string {
  return [
    "✨ ASTROTAG · Tarot Açılımı",
    "",
    `Sorum: ${payload.question}`,
    "",
    cardSpreadLine(payload.cards),
    "",
    readingExcerpt(payload.reading, 420),
    "",
    "#tarot #astrotag #kozmikrehber",
  ].join("\n");
}

export function buildTikTokScriptText(payload: TarotSharePayload): string {
  return [
    "🎬 TikTok — Tarot Açılım Metni",
    "",
    "HOOK: Bugün kartlar bana şunu fısıldadı…",
    "",
    `Soru: ${payload.question}`,
    cardSpreadLine(payload.cards),
    "",
    "YORUM (videoda oku veya altyazı):",
    readingExcerpt(payload.reading, 500),
    "",
    "KAPANIŞ: Senin açılımın farklı olabilir — yorumu kaydet, sonra dene.",
    "",
    "#tarot #tarotokuması #astrotag",
  ].join("\n");
}

export function buildTwitterTweetText(payload: TarotSharePayload): string {
  const cardsShort = payload.cards
    .map((card) => `${card.position[0]}:${card.name.split(" ")[0]}`)
    .join(" · ");

  const core = readingExcerpt(payload.reading, 160);
  const tweet = `ASTROTAG Tarot · ${cardsShort}\n\n${core}\n\n#ASTROTAG #tarot`;

  if (tweet.length <= 280) {
    return tweet;
  }

  return `ASTROTAG Tarot: ${cardsShort}. ${readingExcerpt(payload.reading, 120)} #ASTROTAG`;
}

export function getTwitterShareUrl(tweetText: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
}
