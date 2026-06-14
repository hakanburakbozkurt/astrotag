import type { AspectType, PlanetId } from "@/lib/astrology/types";
import { GeocodeValidationError } from "@/lib/astrology/geocode";
import { calculateCrossAspects } from "@/lib/astrology/aspects";
import { calculateNatalChart } from "@/lib/astrology/planet-positions";
import { hasPartnerData, type UserData } from "@/types/user";

export interface SynastryWheelPlanet {
  id: PlanetId;
  name: string;
  symbol: string;
  longitude: number;
}

export interface SynastryAspectLine {
  id: string;
  userPlanetId: PlanetId;
  partnerPlanetId: PlanetId;
  userBody: string;
  partnerBody: string;
  type: AspectType;
  typeLabel: string;
  angle: number;
  orb: number;
}

export interface SynastryCalculationResult {
  aspectLines: SynastryAspectLine[];
  userPlanets: SynastryWheelPlanet[];
  partnerPlanets: SynastryWheelPlanet[];
  userAscendant: number;
  partnerAscendant: number;
  userName: string;
  partnerName: string;
  insightLines: string[];
}

const PLANET_ID_BY_NAME: Record<string, PlanetId> = {
  Güneş: "sun",
  Ay: "moon",
  Merkür: "mercury",
  Venüs: "venus",
  Mars: "mars",
  Jüpiter: "jupiter",
  Satürn: "saturn",
};

function parseSideBody(value: string): { side: string; name: string } {
  const colonIndex = value.indexOf(":");
  if (colonIndex === -1) {
    return { side: "", name: value };
  }

  return {
    side: value.slice(0, colonIndex),
    name: value.slice(colonIndex + 1),
  };
}

function planetIdFromSideName(side: string, name: string): PlanetId | null {
  const id = PLANET_ID_BY_NAME[name];
  if (!id) {
    return null;
  }

  if (side !== "user" && side !== "partner") {
    return null;
  }

  return id;
}

function buildInsightLines(aspectLines: SynastryAspectLine[]): string[] {
  if (aspectLines.length === 0) {
    return ["Bu çift için belirgin cross-aspect bulunamadı; günlük transitler ilişki dinamiklerini şekillendiriyor."];
  }

  return aspectLines.slice(0, 6).map((aspect) => {
    const tone =
      aspect.type === "square"
        ? "gerilim alanı"
        : aspect.type === "trine"
          ? "doğal uyum"
          : aspect.type === "opposition"
            ? "polarite dengesi"
            : aspect.type === "conjunction"
              ? "birleşim enerjisi"
              : "rezonans";

    return `${aspect.userBody} ↔ ${aspect.partnerBody}: ${aspect.typeLabel} (${aspect.angle}°, orb ${aspect.orb}°) — ${tone}`;
  });
}

export type SynastryCalculationOutcome =
  | { ok: true; data: SynastryCalculationResult }
  | { ok: false; message: string };

/** Kullanıcı + partner natal haritalarından synastry cross-aspect verisini üretir. */
export async function SynastryCalculation(
  userData: UserData
): Promise<SynastryCalculationOutcome> {
  if (!hasPartnerData(userData)) {
    return { ok: false, message: "Partner bilgileri eksik." };
  }

  let userChart;
  let partnerChart;

  try {
    [userChart, partnerChart] = await Promise.all([
      calculateNatalChart({
        birthDate: userData.birthDate,
        birthTime: userData.birthTime,
        birthPlace: userData.birthPlace,
      }),
      calculateNatalChart({
        birthDate: userData.partnerBirthDate!,
        birthTime: userData.partnerBirthTime!,
        birthPlace: userData.partnerBirthPlace!,
      }),
    ]);
  } catch (error) {
    if (error instanceof GeocodeValidationError) {
      return { ok: false, message: error.message };
    }

    throw error;
  }

  const userBodies = userChart.planets.map((planet) => ({
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

  const crossAspects = calculateCrossAspects(userBodies, partnerBodies);

  const aspectLines: SynastryAspectLine[] = [];

  for (const aspect of crossAspects) {
    const bodyA = parseSideBody(aspect.bodyA);
    const bodyB = parseSideBody(aspect.bodyB);

    const userSide = bodyA.side === "user" ? bodyA : bodyB.side === "user" ? bodyB : null;
    const partnerSide =
      bodyA.side === "partner" ? bodyA : bodyB.side === "partner" ? bodyB : null;

    if (!userSide || !partnerSide) {
      continue;
    }

    const userPlanetId = planetIdFromSideName("user", userSide.name);
    const partnerPlanetId = planetIdFromSideName("partner", partnerSide.name);

    if (!userPlanetId || !partnerPlanetId) {
      continue;
    }

    aspectLines.push({
      id: `${userPlanetId}-${partnerPlanetId}-${aspect.type}`,
      userPlanetId,
      partnerPlanetId,
      userBody: userSide.name,
      partnerBody: partnerSide.name,
      type: aspect.type,
      typeLabel: aspect.typeLabel,
      angle: aspect.angle,
      orb: aspect.orb,
    });
  }

  return {
    ok: true,
    data: {
      aspectLines,
      userPlanets: userChart.planets.map((planet) => ({
        id: planet.id,
        name: planet.name,
        symbol: planet.symbol,
        longitude: planet.longitude,
      })),
      partnerPlanets: partnerChart.planets.map((planet) => ({
        id: planet.id,
        name: planet.name,
        symbol: planet.symbol,
        longitude: planet.longitude,
      })),
      userAscendant: userChart.ascendant.longitude,
      partnerAscendant: partnerChart.ascendant.longitude,
      userName: userData.name,
      partnerName: userData.partnerName!.trim(),
      insightLines: buildInsightLines(aspectLines),
    },
  };
}
