import type {
  SynastryAspectLine,
  SynastryCalculationResult,
  SynastryWheelPlanet,
} from "@/lib/synastry/synastry-calculation";
import type { AspectType, PlanetId } from "@/lib/astrology/types";
import type { OrbStrengthTier } from "@/lib/synastry/synastry-aspect-engine";

export type SynastryChartDto = {
  aspectLines: SynastryAspectLineDto[];
  userPlanets: SynastryWheelPlanetDto[];
  partnerPlanets: SynastryWheelPlanetDto[];
  userAscendant: number;
  partnerAscendant: number;
  userName: string;
  partnerName: string;
  insightLines: string[];
  aspectCount: number;
};

export type SynastryWheelPlanetDto = {
  id: PlanetId;
  name: string;
  symbol: string;
  longitude: number;
};

export type SynastryAspectLineDto = {
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
};

function mapPlanet(planet: SynastryWheelPlanet): SynastryWheelPlanetDto {
  return {
    id: planet.id,
    name: planet.name,
    symbol: planet.symbol,
    longitude: planet.longitude,
  };
}

function mapAspect(line: SynastryAspectLine): SynastryAspectLineDto {
  return { ...line };
}

export function serializeSynastryChartData(
  data: SynastryCalculationResult
): SynastryChartDto {
  return {
    aspectLines: data.aspectLines.map(mapAspect),
    userPlanets: data.userPlanets.map(mapPlanet),
    partnerPlanets: data.partnerPlanets.map(mapPlanet),
    userAscendant: data.userAscendant,
    partnerAscendant: data.partnerAscendant,
    userName: data.userName,
    partnerName: data.partnerName,
    insightLines: [...data.insightLines],
    aspectCount: data.aspectLines.length,
  };
}
