import { ZODIAC_SIGNS } from "./zodiac";

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export const ZODIAC_GLYPHS: Record<ZodiacSign, string> = {
  Koç: "♈",
  Boğa: "♉",
  İkizler: "♊",
  Yengeç: "♋",
  Aslan: "♌",
  Başak: "♍",
  Terazi: "♎",
  Akrep: "♏",
  Yay: "♐",
  Oğlak: "♑",
  Kova: "♒",
  Balık: "♓",
};

export function isZodiacSign(value: string): value is ZodiacSign {
  return (ZODIAC_SIGNS as readonly string[]).includes(value);
}
