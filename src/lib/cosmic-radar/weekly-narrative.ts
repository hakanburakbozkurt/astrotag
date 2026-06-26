import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";
import type { WeeklyTransitRow } from "./types";

export interface WeeklyOverviewNarrative {
  introduction: string;
  development: string;
  strategicConclusion: string;
}

const HOUSE_THEMES: Record<number, string> = {
  1: "kimlik, görünürlük ve kişisel yön",
  2: "kaynaklar, değerler ve maddi güvenlik",
  3: "iletişim, öğrenme ve yakın çevre",
  4: "aile, iç dünya ve duygusal temel",
  5: "yaratıcılık, aşk ve ifade",
  6: "sağlık, rutin ve günlük verimlilik",
  7: "ilişkiler, ortaklık ve denge",
  8: "dönüşüm, ortak kaynaklar ve derinlik",
  9: "inanç, eğitim ve ufuk genişlemesi",
  10: "kariyer, statü ve uzun vadeli hedef",
  11: "topluluk, vizyon ve sosyal ağ",
  12: "dinlenme, sezgi ve bilinçaltı süreçler",
};

function houseTheme(house: number): string {
  return HOUSE_THEMES[house] ?? "yaşam deneyimi";
}

function pickFocalTransit(
  rows: WeeklyTransitRow[]
): WeeklyTransitRow {
  const inSign = rows.find((row) => row.inSelectedSign);
  if (inSign) return inSign;
  return rows.find((row) => row.id === "sun") ?? rows[0];
}

function pickSecondaryTransit(
  rows: WeeklyTransitRow[],
  focalId: string
): WeeklyTransitRow | null {
  const moon = rows.find((row) => row.id === "moon" && row.id !== focalId);
  if (moon) return moon;
  return rows.find((row) => row.id !== focalId && row.inSelectedSign) ?? null;
}

export function buildWeeklyOverviewNarrative(params: {
  sign: ZodiacSign;
  transitRows: WeeklyTransitRow[];
  focalAspectLabel: string | null;
  inSignNames: string[];
}): WeeklyOverviewNarrative {
  const { sign, transitRows, focalAspectLabel, inSignNames } = params;
  const focal = pickFocalTransit(transitRows);
  const secondary = pickSecondaryTransit(transitRows, focal.id);
  const theme = houseTheme(focal.house);

  const introduction = `Bu hafta ${sign} yükselenleri için transit ${focal.name}, ${focal.houseLabel} (${focal.positionLabel}) konumunda etkili oluyor. Whole-sign harita perspektifinde bu yerleşim, özellikle ${theme} alanında bir tetiklenme yaratabilir; haftanın ana teması bu eksen üzerinden okunabilir.`;

  const inSignLine =
    inSignNames.length > 0
      ? `${sign} burcunda konumlanan transit gövdeler (${inSignNames.join(", ")}) enerjiyi burç karakterine yönlendirebilir. `
      : "";

  const secondaryLine = secondary
    ? `Transit ${secondary.name}'in ${secondary.houseLabel} (${secondary.positionLabel}) konumu, ${houseTheme(secondary.house)} temasını ikinci planda destekleyebilir veya hızlandırabilir. `
    : "";

  const development = `${inSignLine}${secondaryLine}Ay ve hızlı gezegenlerin hafta içindeki hareketi, duygusal ritmi ve karar alma temposunu gün gün değiştirebilir; bu nedenle sabit bir beklenti yerine esnek planlama tercih edilebilir. Teknik detaylar için gezegen konumları tablosuna bakılabilir.`;

  const aspectLine = focalAspectLabel
    ? `${focalAspectLabel} açısı sebebiyle tempo ve sınırlar birlikte yönetilmelidir. `
    : "Belirgin sert açı baskısı düşük görünüyor; yine de natal haritadaki kişisel hassas noktalara dikkat edilmesi faydalı olabilir. ";

  const strategicConclusion = `${aspectLine}Bu konfigürasyonda ${theme} alanına odaklanmak, haftalık hedefleri netleştirmek ve gereksiz dağılmayı sınırlamak avantajlı bir strateji olabilir. Ölçülü ilerleme, hem fırsatları değerlendirmeyi hem de olası gerilim alanlarında temkinli kalmayı destekleyebilir.`;

  return {
    introduction,
    development,
    strategicConclusion,
  };
}

export function narrativeToCopyText(
  dateRangeLabel: string,
  sign: ZodiacSign,
  narrative: WeeklyOverviewNarrative,
  transitGridText: string
): string {
  return [
    dateRangeLabel,
    `Haftalık Özet (${sign})`,
    "",
    "Giriş",
    narrative.introduction,
    "",
    "Gelişme",
    narrative.development,
    "",
    "Stratejik Sonuç",
    narrative.strategicConclusion,
    "",
    "Gezegen Konumları:",
    transitGridText,
  ].join("\n");
}

export function transitRowsToGridText(
  rows: WeeklyTransitRow[],
  sign: ZodiacSign
): string {
  return rows
    .map(
      (row) =>
        `${row.symbol} ${row.name}: ${row.positionLabel} · ${row.houseLabel} (${sign} ASC)`
    )
    .join("\n");
}
