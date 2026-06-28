import "server-only";

import type { UserData } from "@/types/user";
import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";
import { longitudeToSign } from "@/lib/astrology/zodiac";
import { Body, Ecliptic, EclipticGeoMoon, GeoVector, SunPosition } from "astronomy-engine";
import type { PlanetId } from "@/lib/astrology/types";
import { normalizeLongitude } from "@/lib/astrology/zodiac";
import { calculateCrossAspects } from "@/lib/astrology/aspects";
import { calculateNatalChart } from "@/lib/astrology/planet-positions";
import {
  analyzeHarshCrossAspects,
  buildTransitStressCopy,
  resolveStressLevel,
} from "@/lib/nexus/nexus-transit-stress.logic";

const PLANET_IDS: PlanetId[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
];

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
    return 0;
  }
  const vector = GeoVector(body, date, false);
  return normalizeLongitude(Ecliptic(vector).elon);
}

function snapshotTransitPlanets(date: Date) {
  return PLANET_IDS.map((id) => ({
    id,
    name: id,
    longitude: geocentricLongitude(id, date),
    side: "transit",
  }));
}

function formatTimeTr(date: Date): string {
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export async function computeNexusTransitStress(
  userData: UserData
): Promise<NexusTransitStress> {
  const now = new Date();
  const natalChart = await calculateNatalChart({
    birthDate: userData.birthDate,
    birthTime: userData.birthTime,
    birthPlace: userData.birthPlace,
  });

  const natalBodies = natalChart.planets.map((planet) => ({
    id: planet.id,
    name: planet.name,
    longitude: planet.longitude,
    side: "natal",
  }));

  const currentTransits = snapshotTransitPlanets(now);
  const currentAspects = calculateCrossAspects(currentTransits, natalBodies);
  const nowAnalysis = analyzeHarshCrossAspects(currentAspects);

  let peakDate = new Date(now.getTime() + 60 * 60 * 1000);
  let peakAnalysis = nowAnalysis;

  for (let step = 1; step <= 12; step += 1) {
    const probe = new Date(now.getTime() + step * 30 * 60 * 1000);
    const aspects = calculateCrossAspects(snapshotTransitPlanets(probe), natalBodies);
    const probeAnalysis = analyzeHarshCrossAspects(aspects);

    if (probeAnalysis.count > peakAnalysis.count) {
      peakAnalysis = probeAnalysis;
      peakDate = probe;
    }
  }

  const moonLongitude = currentTransits.find((planet) => planet.id === "moon")?.longitude ?? 0;
  const moonSign = longitudeToSign(moonLongitude).signName;
  const stressLevel = resolveStressLevel(nowAnalysis, peakAnalysis);
  const peakTimeLabel = formatTimeTr(peakDate);
  const copy = buildTransitStressCopy({
    stressLevel,
    harshNow: nowAnalysis.count,
    peakTimeLabel,
    moonSign,
  });

  return {
    stressLevel,
    isStressed: copy.isStressed,
    harshAspectCount: nowAnalysis.count,
    peakTimeLabel,
    tactic: copy.tactic,
    skySummary: copy.skySummary,
  };
}
