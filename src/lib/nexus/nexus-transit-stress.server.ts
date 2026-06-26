import "server-only";

import type { AspectType } from "@/lib/astrology/types";
import type { UserData } from "@/types/user";
import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";
import { longitudeToSign } from "@/lib/astrology/zodiac";
import { Body, Ecliptic, EclipticGeoMoon, GeoVector, SunPosition } from "astronomy-engine";
import type { PlanetId } from "@/lib/astrology/types";
import { normalizeLongitude } from "@/lib/astrology/zodiac";
import { calculateCrossAspects } from "@/lib/astrology/aspects";
import { calculateNatalChart } from "@/lib/astrology/planet-positions";

const HARSH_TYPES: AspectType[] = ["square", "opposition"];

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

function countHarshTransits(
  aspects: Array<{ type: AspectType; orb: number }>
): number {
  return aspects.filter(
    (aspect) =>
      HARSH_TYPES.includes(aspect.type) && aspect.orb <= 4
  ).length;
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
  const harshNow = countHarshTransits(currentAspects);

  let peakDate = new Date(now.getTime() + 60 * 60 * 1000);
  let peakHarsh = harshNow;

  for (let step = 1; step <= 12; step += 1) {
    const probe = new Date(now.getTime() + step * 30 * 60 * 1000);
    const aspects = calculateCrossAspects(snapshotTransitPlanets(probe), natalBodies);
    const harsh = countHarshTransits(aspects);

    if (harsh > peakHarsh) {
      peakHarsh = harsh;
      peakDate = probe;
    }
  }

  const moonLongitude = currentTransits.find((planet) => planet.id === "moon")?.longitude ?? 0;
  const moonSign = longitudeToSign(moonLongitude).signName;

  let stressLevel: NexusTransitStress["stressLevel"] = "calm";
  if (harshNow >= 3 || peakHarsh >= 4) {
    stressLevel = "high";
  } else if (harshNow >= 1 || peakHarsh >= 2) {
    stressLevel = "moderate";
  }

  const isStressed = stressLevel !== "calm";
  const peakTimeLabel = formatTimeTr(peakDate);

  const tactic = isStressed
    ? `Stres Uyarısı: ${peakTimeLabel}'da gökyüzü baskısı artıyor, sakin kal.`
    : "Gökyüzü bugün nispeten yumuşak — odaklan ve akışa güven.";

  const skySummary = isStressed
    ? `${harshNow} sert transit açısı aktif · zirve ${peakTimeLabel}`
    : `Transit baskısı düşük · Ay hattı ${moonSign}`;

  return {
    stressLevel,
    isStressed,
    harshAspectCount: harshNow,
    peakTimeLabel,
    tactic,
    skySummary,
  };
}
