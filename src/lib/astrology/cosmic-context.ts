import type { UserData } from "@/types/user";
import { hasPartnerData } from "@/types/user";
import { calculateCrossAspects } from "./aspects";
import {
  calculateNatalChart,
  getNatalChartSummary,
  resolveBirthContext,
} from "./planet-positions";
import type { NatalChartSummary } from "./types";
import { Body, Ecliptic, EclipticGeoMoon, GeoVector, SunPosition } from "astronomy-engine";
import type { PlanetId } from "./types";
import { normalizeLongitude } from "./zodiac";

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

function snapshotPlanets(date: Date, side: string) {
  return PLANET_IDS.map((id) => ({
    id,
    name: PLANET_NAMES[id],
    longitude: geocentricLongitude(id, date),
    side,
  }));
}

export interface CosmicAnalysisContext {
  askedAt: string;
  natal: NatalChartSummary;
  horaryMoment: {
    at: string;
    planets: ReturnType<typeof snapshotPlanets>;
  };
  transits: {
    at: string;
    planets: ReturnType<typeof snapshotPlanets>;
    aspectsToNatal: ReturnType<typeof calculateCrossAspects>;
  };
  synastry: {
    partnerName: string;
    partnerNatal: NatalChartSummary;
    crossAspects: ReturnType<typeof calculateCrossAspects>;
  } | null;
}

export async function buildCosmicAnalysisContext(
  userData: UserData,
  askedAt: Date = new Date()
): Promise<CosmicAnalysisContext> {
  const natalChart = await calculateNatalChart({
    birthDate: userData.birthDate,
    birthTime: userData.birthTime,
    birthPlace: userData.birthPlace,
  });
  const natal = getNatalChartSummary(natalChart);

  const horaryPlanets = snapshotPlanets(askedAt, "horary");
  const transitPlanets = snapshotPlanets(askedAt, "transit");
  const natalBodies = natalChart.planets.map((planet) => ({
    id: planet.id,
    name: planet.name,
    longitude: planet.longitude,
    side: "natal",
  }));

  const transits = {
    at: askedAt.toISOString(),
    planets: transitPlanets,
    aspectsToNatal: calculateCrossAspects(transitPlanets, natalBodies),
  };

  let synastry: CosmicAnalysisContext["synastry"] = null;

  if (hasPartnerData(userData)) {
    const partnerChart = await calculateNatalChart({
      birthDate: userData.partnerBirthDate!,
      birthTime: userData.partnerBirthTime!,
      birthPlace: userData.partnerBirthPlace!,
    });
    const partnerNatal = getNatalChartSummary(partnerChart);
    const userBodies = natalChart.planets.map((planet) => ({
      id: planet.id,
      name: planet.name,
      longitude: planet.longitude,
      side: "user",
    }));
    const partnerBodies = partnerChart.planets.map((planet) => ({
      id: planet.id,
      name: planet.name,
      longitude: planet.longitude,
      side: "partner",
    }));

    synastry = {
      partnerName: userData.partnerName!.trim(),
      partnerNatal,
      crossAspects: calculateCrossAspects(userBodies, partnerBodies),
    };
  }

  return {
    askedAt: askedAt.toISOString(),
    natal,
    horaryMoment: {
      at: askedAt.toISOString(),
      planets: horaryPlanets,
    },
    transits,
    synastry,
  };
}

export async function buildHoraryLocationContext(userData: UserData) {
  return resolveBirthContext({
    birthDate: userData.birthDate,
    birthTime: userData.birthTime,
    birthPlace: userData.birthPlace,
  });
}
