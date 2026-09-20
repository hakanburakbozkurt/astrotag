export const FEED_MODERATION_REJECT_MESSAGE =
  "Gönderi platform kurallarına uymuyor. Ticari içerik, iletişim bilgisi veya bağlantı paylaşımı yasaktır.";

export type FeedModerationResult =
  | { ok: true }
  | { ok: false; reason: string; matchedRule?: string };

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9-]+\.(?:com|net|org|io|co|me|tr|link|app|xyz|shop|store|biz|info|tv|gg|ly|be|to|cc)\b/i;

const PHONE_PATTERN =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?0\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|\b05\d{9}\b/;

const IBAN_PATTERN = /\bTR[\s-]?\d{2}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{2}\b/i;

const PRICE_PATTERN =
  /\b(?:₺|tl|try|usd|\$|€|eur|kristal|crystal|fiyat|ücret|indirim|kampanya|bedava|ucretsiz|free\s*reading)\b/i;

const COMMERCIAL_KEYWORDS = [
  "whatsapp",
  "whats app",
  "dm at",
  "dm gönder",
  "iban",
  "papara",
  "paytr",
  "iyzico",
  "shopier",
  "satılık",
  "satış",
  "hizmet veriyorum",
  "randevu al",
  "ücretsiz danışmanlık",
  "takip et",
  "link bio",
  "linktree",
  "instagram",
  "telegram",
  "t.me",
  "reklam",
  "sponsor",
  "affiliate",
  "kupon",
  "promo code",
  "indirim kodu",
  "crypto",
  "kripto",
  "forex",
  "network marketing",
  "mlm",
  "earn money",
  "para kazan",
];

const SPAM_KEYWORDS = [
  "click here",
  "tıkla",
  "hemen yaz",
  "limited offer",
  "son gün",
  "acil fırsat",
  "100% garanti",
  "garantili sonuç",
  "abone ol",
  "subscribe now",
];

function normalizeForScan(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[@]/g, "a")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/\s+/g, " ")
    .trim();
}

function containsKeyword(text: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      return keyword;
    }
  }
  return null;
}

export function moderateFeedText(raw: string): FeedModerationResult {
  const text = raw.trim();
  if (!text) {
    return { ok: false, reason: "Metin boş olamaz.", matchedRule: "empty" };
  }

  const normalized = normalizeForScan(text);

  if (URL_PATTERN.test(text) || URL_PATTERN.test(normalized)) {
    return {
      ok: false,
      reason: FEED_MODERATION_REJECT_MESSAGE,
      matchedRule: "url",
    };
  }

  if (PHONE_PATTERN.test(text.replace(/\s/g, ""))) {
    return {
      ok: false,
      reason: FEED_MODERATION_REJECT_MESSAGE,
      matchedRule: "phone",
    };
  }

  if (IBAN_PATTERN.test(text)) {
    return {
      ok: false,
      reason: FEED_MODERATION_REJECT_MESSAGE,
      matchedRule: "iban",
    };
  }

  if (PRICE_PATTERN.test(normalized)) {
    return {
      ok: false,
      reason: FEED_MODERATION_REJECT_MESSAGE,
      matchedRule: "price",
    };
  }

  const commercial = containsKeyword(normalized, COMMERCIAL_KEYWORDS);
  if (commercial) {
    return {
      ok: false,
      reason: FEED_MODERATION_REJECT_MESSAGE,
      matchedRule: `commercial:${commercial}`,
    };
  }

  const spam = containsKeyword(normalized, SPAM_KEYWORDS);
  if (spam) {
    return {
      ok: false,
      reason: FEED_MODERATION_REJECT_MESSAGE,
      matchedRule: `spam:${spam}`,
    };
  }

  return { ok: true };
}
