export const ZODIAC_SIGNS = [
  "Koç",
  "Boğa",
  "İkizler",
  "Yengeç",
  "Aslan",
  "Başak",
  "Terazi",
  "Akrep",
  "Yay",
  "Oğlak",
  "Kova",
  "Balık",
] as const;

export function normalizeLongitude(longitude: number): number {
  const normalized = longitude % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function longitudeToSign(longitude: number) {
  const normalized = normalizeLongitude(longitude);
  // 360° tam sınırda Balık (11), aksi halde 0–359 aralığı
  const signIndex =
    normalized >= 360 ? 11 : Math.min(11, Math.floor(normalized / 30));
  const degreeInSign = normalized - signIndex * 30;

  return {
    signIndex,
    signName: ZODIAC_SIGNS[signIndex],
    degreeInSign,
    label: `${Math.floor(degreeInSign)}° ${ZODIAC_SIGNS[signIndex]}`,
  };
}

/** Burç segmentinin ortası — çember etiketleri için. */
export function signMidpointLongitude(signIndex: number): number {
  return normalizeLongitude(signIndex * 30 + 15);
}
