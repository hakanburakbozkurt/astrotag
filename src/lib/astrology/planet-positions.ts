import {
  Body,
  Ecliptic,
  EclipticGeoMoon,
  GeoVector,
  SunPosition,
} from "astronomy-engine";
import type {
  Aspect,
  BirthContext,
  ChartBodyId,
  NatalChartData,
  NatalChartSummary,
  PlanetId,
  PlanetPosition,
} from "./types";
import { calculateAspects } from "./aspects";
import {
  calculateExtendedAspectsForBodies,
} from "./natal-extended-aspects";
import { computeMinorPoints } from "./natal-master-data";
import {
  calculateAscendant,
  calculateEqualHouses,
  planetHouse,
} from "./ascendant";
import { localBirthToUtc } from "./birth-moment";
import { resolveBirthPlace } from "./geocode";
import { longitudeToSign, normalizeLongitude } from "./zodiac";

export function formatPlanetCardLabel(
  sign: Pick<
    ReturnType<typeof longitudeToSign>,
    "degreeInSign" | "signName"
  >,
  house: number
): string {
  return `${Math.floor(sign.degreeInSign)}° ${sign.signName} - ${house}. Ev`;
}

/** longitudeToSign ile tek kaynaktan türetilmiş görüntü alanları */
export function buildPlanetDisplayFields(
  longitude: number,
  house: number
) {
  const sign = longitudeToSign(longitude);
  return {
    signIndex: sign.signIndex,
    signName: sign.signName,
    degreeInSign: sign.degreeInSign,
    label: sign.label,
    house,
    cardLabel: formatPlanetCardLabel(sign, house),
  };
}

const PLANET_META: Array<{
  id: PlanetId;
  name: string;
  symbol: string;
  body?: Body;
}> = [
  { id: "sun", name: "Güneş", symbol: "☉" },
  { id: "moon", name: "Ay", symbol: "☽" },
  { id: "mercury", name: "Merkür", symbol: "☿", body: Body.Mercury },
  { id: "venus", name: "Venüs", symbol: "♀", body: Body.Venus },
  { id: "mars", name: "Mars", symbol: "♂", body: Body.Mars },
  { id: "jupiter", name: "Jüpiter", symbol: "♃", body: Body.Jupiter },
  { id: "saturn", name: "Satürn", symbol: "♄", body: Body.Saturn },
];

const PLANET_IDS = new Set<PlanetId>([
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
]);

function isPlanetId(id: ChartBodyId): id is PlanetId {
  return PLANET_IDS.has(id as PlanetId);
}

function geocentricLongitude(id: PlanetId, date: Date): number {
  if (id === "sun") {
    return normalizeLongitude(SunPosition(date).elon);
  }

  if (id === "moon") {
    return normalizeLongitude(EclipticGeoMoon(date).lon);
  }

  const meta = PLANET_META.find((planet) => planet.id === id);
  if (!meta?.body) {
    throw new Error(`Unknown planet: ${id}`);
  }

  const vector = GeoVector(meta.body, date, false);
  return normalizeLongitude(Ecliptic(vector).elon);
}

function toPlanetPosition(
  id: PlanetId,
  date: Date,
  ascendantLongitude: number
): PlanetPosition {
  const meta = PLANET_META.find((planet) => planet.id === id)!;
  const longitude = geocentricLongitude(id, date);
  const house = planetHouse(longitude, ascendantLongitude);
  const display = buildPlanetDisplayFields(longitude, house);

  return {
    id,
    name: meta.name,
    symbol: meta.symbol,
    longitude,
    ...display,
  };
}

export function computeNatalChart(context: BirthContext): NatalChartData {
  const { birthUtc, coordinates } = context;
  const ascendant = calculateAscendant(
    birthUtc,
    coordinates.latitude,
    coordinates.longitude
  );
  const houses = calculateEqualHouses(ascendant);
  const planets = PLANET_META.map(({ id }) =>
    toPlanetPosition(id, birthUtc, ascendant.longitude)
  );
  const aspects = calculateAspects(planets);
  const minorPoints = computeMinorPoints(birthUtc, ascendant.longitude);
  const extendedAspects = calculateExtendedAspectsForBodies([
    ...planets.map((planet) => ({
      id: planet.id,
      longitude: planet.longitude,
    })),
    ...minorPoints.map((point) => ({
      id: point.id,
      longitude: point.longitude,
    })),
  ]);

  return {
    birthUtc,
    coordinates,
    ascendant,
    houses,
    planets,
    aspects,
    minorPoints,
    extendedAspects,
  };
}

export async function resolveBirthContext(input: {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}): Promise<BirthContext> {
  const coordinates = await resolveBirthPlace(input.birthPlace);
  const birthUtc = localBirthToUtc(
    input.birthDate,
    input.birthTime,
    coordinates.timezone
  );

  return { birthUtc, coordinates };
}

export async function calculateNatalChart(input: {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}): Promise<NatalChartData> {
  const context = await resolveBirthContext(input);
  return computeNatalChart(context);
}

export function getNatalChartSummary(data: NatalChartData): NatalChartSummary {
  return {
    meta: {
      birthUtc: data.birthUtc.toISOString(),
      birthPlace: data.coordinates.displayName,
      latitude: data.coordinates.latitude,
      longitude: data.coordinates.longitude,
      timezone: data.coordinates.timezone,
    },
    ascendant: data.ascendant,
    planets: data.planets.map((planet) => ({
      id: planet.id,
      name: planet.name,
      longitude: Number(planet.longitude.toFixed(2)),
      sign: planet.signName,
      degreeInSign: Number(planet.degreeInSign.toFixed(2)),
      label: planet.cardLabel,
      house: planet.house,
    })),
    aspects: data.aspects
      .filter(
        (aspect): aspect is Aspect & { planetA: PlanetId; planetB: PlanetId } =>
          !aspect.isMinor &&
          isPlanetId(aspect.planetA) &&
          isPlanetId(aspect.planetB)
      )
      .map((aspect) => ({
        planetA: aspect.planetA,
        planetB: aspect.planetB,
        type: aspect.type as import("./types").AspectType,
        typeLabel: aspect.typeLabel,
        angle: aspect.angle,
        orb: aspect.orb,
      })),
    houses: data.houses,
  };
}
