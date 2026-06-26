import { ZODIAC_SIGNS } from "@/lib/astrology/zodiac";
import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";
import { normalizeLongitude } from "@/lib/astrology/zodiac";
import { planetHouse } from "@/lib/astrology/ascendant";
import type { TransitPlanetSnapshot } from "./transit-snapshot";

/** Engine SSOT: seçilen burç için whole-sign yükselen derecesi (0–360). */
export function getSignAscendantDegree(sign: ZodiacSign): number {
  const index = ZODIAC_SIGNS.indexOf(sign);
  return normalizeLongitude(index * 30);
}

/** @deprecated getSignAscendantDegree kullanın */
export function signAscendantLongitude(sign: ZodiacSign): number {
  return getSignAscendantDegree(sign);
}

export function transitHouseForSign(
  transitLongitude: number,
  sign: ZodiacSign
): number {
  return planetHouse(transitLongitude, getSignAscendantDegree(sign));
}

export function annotateTransitsForSign(
  transits: TransitPlanetSnapshot[],
  sign: ZodiacSign
): Array<TransitPlanetSnapshot & { house: number }> {
  return transits.map((planet) => ({
    ...planet,
    house: transitHouseForSign(planet.zodiacDegree, sign),
  }));
}
