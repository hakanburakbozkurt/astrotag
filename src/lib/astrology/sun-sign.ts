import { ZODIAC_SIGNS } from "./zodiac";

type SunSignBoundary = {
  sign: (typeof ZODIAC_SIGNS)[number];
  month: number;
  day: number;
};

/** Tropical Güneş burcu — doğum tarihinden (YYYY-MM-DD). */
const SUN_SIGN_BOUNDARIES: SunSignBoundary[] = [
  { sign: "Oğlak", month: 1, day: 1 },
  { sign: "Kova", month: 1, day: 20 },
  { sign: "Balık", month: 2, day: 19 },
  { sign: "Koç", month: 3, day: 21 },
  { sign: "Boğa", month: 4, day: 20 },
  { sign: "İkizler", month: 5, day: 21 },
  { sign: "Yengeç", month: 6, day: 21 },
  { sign: "Aslan", month: 7, day: 23 },
  { sign: "Başak", month: 8, day: 23 },
  { sign: "Terazi", month: 9, day: 23 },
  { sign: "Akrep", month: 10, day: 23 },
  { sign: "Yay", month: 11, day: 22 },
  { sign: "Oğlak", month: 12, day: 22 },
];

function parseBirthDateParts(birthDate: string): { month: number; day: number } | null {
  const isoMatch = birthDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
    };
  }

  const dottedMatch = birthDate.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dottedMatch) {
    return {
      month: Number(dottedMatch[2]),
      day: Number(dottedMatch[1]),
    };
  }

  return null;
}

function isOnOrAfter(month: number, day: number, boundary: SunSignBoundary): boolean {
  if (month > boundary.month) {
    return true;
  }

  if (month < boundary.month) {
    return false;
  }

  return day >= boundary.day;
}

export function sunSignFromBirthDate(birthDate: string | null | undefined): string | null {
  if (!birthDate?.trim()) {
    return null;
  }

  const parts = parseBirthDateParts(birthDate);
  if (!parts || parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31) {
    return null;
  }

  let sign: (typeof ZODIAC_SIGNS)[number] = "Oğlak";

  for (const boundary of SUN_SIGN_BOUNDARIES) {
    if (isOnOrAfter(parts.month, parts.day, boundary)) {
      sign = boundary.sign;
    }
  }

  return sign;
}

export function resolveProfileSunSigns(user: {
  birthDate: string;
  partnerBirthDate?: string | null;
}): {
  userSign: string | null;
  partnerSign: string | null;
} {
  return {
    userSign: sunSignFromBirthDate(user.birthDate),
    partnerSign: sunSignFromBirthDate(user.partnerBirthDate),
  };
}
