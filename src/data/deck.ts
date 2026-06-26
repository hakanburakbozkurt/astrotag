export type CardSuit = "major-arcana" | "wands" | "cups" | "swords" | "pentacles";

export interface Card {
  id: string;
  name: string;
  suit: CardSuit;
  imagePath: string;
  keywords: string[];
}

import { resolveTarotImagePath } from "@/lib/tarot/image-paths";

const MAJOR_ARCANA_META: Array<{
  id: string;
  name: string;
  keywords: string[];
}> = [
  { id: "00-fool", name: "The Fool", keywords: ["New Beginnings", "Courage"] },
  { id: "01-magician", name: "The Magician", keywords: ["Intent", "Focus"] },
  { id: "02-high-priestess", name: "The High Priestess", keywords: ["Intuition", "Mystery"] },
  { id: "03-empress", name: "The Empress", keywords: ["Abundance", "Creativity"] },
  { id: "04-emperor", name: "The Emperor", keywords: ["Structure", "Authority"] },
  { id: "05-hierophant", name: "The Hierophant", keywords: ["Tradition", "Guidance"] },
  { id: "06-lovers", name: "The Lovers", keywords: ["Choice", "Harmony"] },
  { id: "07-chariot", name: "The Chariot", keywords: ["Willpower", "Victory"] },
  { id: "08-strength", name: "Strength", keywords: ["Patience", "Inner Courage"] },
  { id: "09-hermit", name: "The Hermit", keywords: ["Reflection", "Wisdom"] },
  { id: "10-wheel", name: "Wheel of Fortune", keywords: ["Cycles", "Destiny"] },
  { id: "11-justice", name: "Justice", keywords: ["Balance", "Truth"] },
  { id: "12-hanged", name: "The Hanged Man", keywords: ["Surrender", "Perspective"] },
  { id: "13-death", name: "Death", keywords: ["Transformation", "Renewal"] },
  { id: "14-temperance", name: "Temperance", keywords: ["Harmony", "Moderation"] },
  { id: "15-devil", name: "The Devil", keywords: ["Shadow", "Attachment"] },
  { id: "16-tower", name: "The Tower", keywords: ["Upheaval", "Awakening"] },
  { id: "17-star", name: "The Star", keywords: ["Hope", "Inspiration"] },
  { id: "18-moon", name: "The Moon", keywords: ["Dreams", "Subconscious"] },
  { id: "19-sun", name: "The Sun", keywords: ["Joy", "Clarity"] },
  { id: "20-judgement", name: "Judgement", keywords: ["Rebirth", "Calling"] },
  { id: "21-world", name: "The World", keywords: ["Completion", "Wholeness"] },
];

const MINOR_SUITS = ["wands", "cups", "swords", "pentacles"] as const;

const MINOR_RANKS = [
  { slug: "ace", label: "Ace" },
  { slug: "02", label: "Two" },
  { slug: "03", label: "Three" },
  { slug: "04", label: "Four" },
  { slug: "05", label: "Five" },
  { slug: "06", label: "Six" },
  { slug: "07", label: "Seven" },
  { slug: "08", label: "Eight" },
  { slug: "09", label: "Nine" },
  { slug: "10", label: "Ten" },
  { slug: "page", label: "Page" },
  { slug: "knight", label: "Knight" },
  { slug: "queen", label: "Queen" },
  { slug: "king", label: "King" },
] as const;

const SUIT_KEYWORDS: Record<(typeof MINOR_SUITS)[number], string[]> = {
  wands: ["Passion", "Action", "Creativity"],
  cups: ["Emotion", "Intuition", "Relationships"],
  swords: ["Mind", "Truth", "Conflict"],
  pentacles: ["Material", "Work", "Stability"],
};

const SUIT_LABELS: Record<(typeof MINOR_SUITS)[number], string> = {
  wands: "Wands",
  cups: "Cups",
  swords: "Swords",
  pentacles: "Pentacles",
};

export function buildMajorArcanaImagePath(id: string): string {
  return resolveTarotImagePath(id);
}

export function buildMinorArcanaImagePath(
  suit: (typeof MINOR_SUITS)[number],
  rankSlug: string
): string {
  return resolveTarotImagePath(`${suit}-${rankSlug}`);
}

/** Resolves image path from the canonical folder layout under public/assets/tarot/. */
export function resolveCardImagePath(card: Pick<Card, "imagePath">): string {
  return card.imagePath;
}

function buildMajorArcana(): Card[] {
  return MAJOR_ARCANA_META.map((card) => ({
    id: card.id,
    name: card.name,
    suit: "major-arcana" as const,
    imagePath: buildMajorArcanaImagePath(card.id),
    keywords: card.keywords,
  }));
}

function buildMinorArcana(): Card[] {
  const cards: Card[] = [];

  for (const suit of MINOR_SUITS) {
    for (const rank of MINOR_RANKS) {
      cards.push({
        id: `${suit}-${rank.slug}`,
        name: `${rank.label} of ${SUIT_LABELS[suit]}`,
        suit,
        imagePath: buildMinorArcanaImagePath(suit, rank.slug),
        keywords: SUIT_KEYWORDS[suit],
      });
    }
  }

  return cards;
}

export const MAJOR_ARCANA_CARDS: Card[] = buildMajorArcana();
export const MINOR_ARCANA_CARDS: Card[] = buildMinorArcana();
export const FULL_DECK: Card[] = [...MAJOR_ARCANA_CARDS, ...MINOR_ARCANA_CARDS];

/** Canonical 78-card tarot deck (alias). */
export const tarotDeck: Card[] = FULL_DECK;

export function getCardById(id: string): Card | undefined {
  return FULL_DECK.find((card) => card.id === id);
}

export function shuffleCards(cards: Card[]): Card[] {
  const copy = [...cards];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
