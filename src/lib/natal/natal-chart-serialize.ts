import type { NatalChartData } from "@/lib/astrology/types";

export type NatalChartDto = {
  birthUtc: string;
  coordinates: NatalChartData["coordinates"];
  ascendant: NatalChartData["ascendant"];
  houses: NatalChartData["houses"];
  planets: NatalChartData["planets"];
  aspects: NatalChartData["aspects"];
  minorPoints: NatalChartData["minorPoints"];
  extendedAspects: NatalChartData["extendedAspects"];
};

export function serializeNatalChartData(data: NatalChartData): NatalChartDto {
  return {
    birthUtc: data.birthUtc.toISOString(),
    coordinates: data.coordinates,
    ascendant: data.ascendant,
    houses: data.houses,
    planets: data.planets,
    aspects: data.aspects,
    minorPoints: data.minorPoints,
    extendedAspects: data.extendedAspects,
  };
}
