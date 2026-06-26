import { Body, Ecliptic, EclipticGeoMoon, GeoVector, SunPosition } from "astronomy-engine";
import type { PlanetId } from "@/lib/astrology/types";
import { normalizeLongitude, longitudeToSign } from "@/lib/astrology/zodiac";
import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";

const PLANET_IDS: PlanetId[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
];

const PLANET_NAMES: Record<PlanetId, string> = {
  sun: "Güneş",
  moon: "Ay",
  mercury: "Merkür",
  venus: "Venüs",
  mars: "Mars",
  jupiter: "Jüpiter",
  saturn: "Satürn",
};

const BODY_MAP: Partial<Record<PlanetId, Body>> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
};

export interface TransitPlanetSnapshot {
  id: PlanetId;
  name: string;
  /** Engine ecliptic derecesi (0–360) — görsel yerleşim SSOT */
  zodiacDegree: number;
  /** @deprecated zodiacDegree kullanın */
  longitude: number;
  signName: ZodiacSign;
  label: string;
}

function geocentricLongitude(id: PlanetId, date: Date): number {
  if (id === "sun") {
    return normalizeLongitude(SunPosition(date).elon);
  }
  if (id === "moon") {
    return normalizeLongitude(EclipticGeoMoon(date).lon);
  }
  const body = BODY_MAP[id];
  if (!body) {
    throw new Error(`Unknown planet: ${id}`);
  }
  const vector = GeoVector(body, date, false);
  return normalizeLongitude(Ecliptic(vector).elon);
}

export function snapshotTransitPlanets(date: Date): TransitPlanetSnapshot[] {
  return PLANET_IDS.map((id) => {
    const longitude = geocentricLongitude(id, date);
    const sign = longitudeToSign(longitude);
    return {
      id,
      name: PLANET_NAMES[id],
      zodiacDegree: longitude,
      longitude,
      signName: sign.signName as ZodiacSign,
      label: sign.label,
    };
  });
}

export function planetsInSign(
  planets: TransitPlanetSnapshot[],
  sign: ZodiacSign
): TransitPlanetSnapshot[] {
  return planets.filter((planet) => planet.signName === sign);
}
