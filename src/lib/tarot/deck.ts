import {
  FULL_DECK,
  MAJOR_ARCANA_CARDS,
  getCardById as getDataCardById,
  shuffleCards,
  type Card,
} from "@/data/deck";

export interface TarotCardDefinition {
  id: string;
  slug: string;
  name: string;
  englishName: string;
  keyword: string;
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  meaning: string;
  imagePath: string;
}

export type { Card, CardSuit } from "@/data/deck";
export { FULL_DECK, MAJOR_ARCANA_CARDS, shuffleCards, tarotDeck } from "@/data/deck";

function cardToDefinition(card: Card): TarotCardDefinition {
  const isMajor = card.suit === "major-arcana";

  return {
    id: card.id,
    slug: card.id,
    name: card.name,
    englishName: card.name,
    keyword: card.keywords[0] ?? "",
    arcana: isMajor ? "major" : "minor",
    suit: isMajor ? undefined : (card.suit as "wands" | "cups" | "swords" | "pentacles"),
    meaning: card.keywords.join(", "),
    imagePath: card.imagePath,
  };
}

/** Major Arcana only — 22 cards (00–21). */
export const MAJOR_ARCANA_DECK: TarotCardDefinition[] =
  MAJOR_ARCANA_CARDS.map(cardToDefinition);

/** Full 78-card deck mapped to app definition shape. */
export const TAROT_DECK_FULL: TarotCardDefinition[] = FULL_DECK.map(cardToDefinition);

/** Active tarot deck — full 78 cards. */
export const TAROT_DECK: TarotCardDefinition[] = TAROT_DECK_FULL;

export { TAROT_CARD_BACK } from "@/lib/tarot/image-paths";

export function getTarotCardById(id: string): TarotCardDefinition | undefined {
  const card = getDataCardById(id);
  return card ? cardToDefinition(card) : undefined;
}

export function buildCardSignature(cardIds: string[]): string {
  return [...cardIds].sort().join("|");
}

export function shuffleDeck<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function drawRandomCards(count: number): TarotCardDefinition[] {
  return shuffleDeck(MAJOR_ARCANA_DECK).slice(0, count);
}
