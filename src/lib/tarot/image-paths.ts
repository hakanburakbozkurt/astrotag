const TAROT_ASSET_BASE = "/assets/tarot";

/** Major arcana kart id → dosya adı (uzantısız). */
const MAJOR_ID_TO_FILENAME: Record<string, string> = {
  "00-fool": "the-fool",
  "01-magician": "the-magician",
  "02-high-priestess": "the-high-priestess",
  "03-empress": "the-empress",
  "04-emperor": "the-emperor",
  "05-hierophant": "the-hierophant",
  "06-lovers": "the-lovers",
  "07-chariot": "the-chariot",
  "08-strength": "strength",
  "09-hermit": "the-hermit",
  "10-wheel": "wheel-of-fortune",
  "11-justice": "justice",
  "12-hanged": "the-hanged-man",
  "13-death": "death",
  "14-temperance": "temperance",
  "15-devil": "the-devil",
  "16-tower": "the-tower",
  "17-star": "the-star",
  "18-moon": "the-moon",
  "19-sun": "the-sun",
  "20-judgement": "judgement",
  "21-world": "the-world",
};

/** Minor suit → Türkçe dosya öneki (public/assets/tarot/ kökünde). */
const SUIT_TO_FILE_PREFIX: Record<string, string> = {
  wands: "degnek",
  cups: "kupa",
  swords: "kilic",
  pentacles: "tilsim",
};

/** Rank slug → dosya soneki. */
const RANK_TO_FILE_SUFFIX: Record<string, string> = {
  ace: "asi",
  "02": "ikilisi",
  "03": "uclusu",
  "04": "dortlusu",
  "05": "beslisi",
  "06": "altilisi",
  "07": "yedilisi",
  "08": "sekizlisi",
  "09": "dokuzlusu",
  "10": "onlusu",
  page: "valesi",
  knight: "sovalyesi",
  queen: "kralicesi",
  king: "krali",
};

/** Kılıç 6 — dosya adında Türkçe ı: kilic-altılısi.webp */
const SWORDS_SIX_SUFFIX = "altılısi";

const MINOR_SUIT_PATTERN = /^(wands|cups|swords|pentacles)-(.+)$/;

export function getTarotAssetFilename(cardId: string): string | null {
  if (cardId === "card-back") {
    return "card-back.svg";
  }

  const majorFile = MAJOR_ID_TO_FILENAME[cardId];
  if (majorFile) {
    return `${majorFile}.webp`;
  }

  const minorMatch = cardId.match(MINOR_SUIT_PATTERN);
  if (!minorMatch) {
    return null;
  }

  const [, suit, rank] = minorMatch;
  const prefix = SUIT_TO_FILE_PREFIX[suit];
  if (!prefix) {
    return null;
  }

  let suffix = RANK_TO_FILE_SUFFIX[rank];
  if (suit === "swords" && rank === "06") {
    suffix = SWORDS_SIX_SUFFIX;
  }

  if (!suffix) {
    return null;
  }

  return `${prefix}-${suffix}.webp`;
}

export function getTarotImageCandidates(cardId: string): string[] {
  const filename = getTarotAssetFilename(cardId);
  if (!filename) {
    return [];
  }

  return [`${TAROT_ASSET_BASE}/${filename}`];
}

export function resolveTarotImagePath(cardId: string): string {
  return getTarotImageCandidates(cardId)[0] ?? "";
}

export function hasTarotImageAsset(cardId: string): boolean {
  return getTarotAssetFilename(cardId) !== null;
}

export const TAROT_CARD_BACK = resolveTarotImagePath("card-back");
