import type { AspectType, PlanetId } from "@/lib/astrology/types";
import { GeocodeValidationError } from "@/lib/astrology/geocode";
import { calculateNatalChart } from "@/lib/astrology/planet-positions";
import type { OrbStrengthTier } from "@/lib/synastry/synastry-aspect-engine";
import {
  buildSynastryInsightLine,
  detectSynastryCrossAspect,
} from "@/lib/synastry/synastry-aspect-engine";
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
  separation: number;
  orbStrength: OrbStrengthTier;
  orbStrengthLabel: string;
  astroNote: string;
  samePlanetPair: boolean;
  aspectTitle: string;
  planetEffect: string;
  aspectDetail: string;
  orbTechnical: string;
  isExactAspect: boolean;
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

function buildInsightLines(aspectLines: SynastryAspectLine[]): string[] {
  if (aspectLines.length === 0) {
    return [
      "Bu çift için belirgin cross-aspect bulunamadı; günlük transitler ilişki dinamiklerini şekillendiriyor.",
    ];
  }

  return aspectLines.slice(0, 8).map((aspect) =>
    buildSynastryInsightLine({
      aspectTitle: aspect.aspectTitle,
      aspectDetail: aspect.aspectDetail,
      orbTechnical: aspect.orbTechnical,
      planetEffect: aspect.planetEffect,
    })
  );
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

  const aspectLines: SynastryAspectLine[] = [];

  for (const userPlanet of userChart.planets) {
    for (const partnerPlanet of partnerChart.planets) {
      const match = detectSynastryCrossAspect({
        userLongitude: userPlanet.longitude,
        partnerLongitude: partnerPlanet.longitude,
        userPlanetId: userPlanet.id,
        partnerPlanetId: partnerPlanet.id,
      });

      if (!match) {
        continue;
      }

      aspectLines.push({
        id: `${userPlanet.id}-${partnerPlanet.id}-${match.type}`,
        userPlanetId: userPlanet.id,
        partnerPlanetId: partnerPlanet.id,
        userBody: userPlanet.name,
        partnerBody: partnerPlanet.name,
        type: match.type,
        typeLabel: match.typeLabel,
        angle: match.angle,
        orb: match.orb,
        separation: match.separation,
        orbStrength: match.orbStrength,
        orbStrengthLabel: match.orbStrengthLabel,
        astroNote: match.astroNote,
        samePlanetPair: match.samePlanetPair,
        aspectTitle: match.aspectTitle,
        planetEffect: match.planetEffect,
        aspectDetail: match.aspectDetail,
        orbTechnical: match.orbTechnical,
        isExactAspect: match.isExactAspect,
      });
    }
  }

  aspectLines.sort((a, b) => a.orb - b.orb);

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
