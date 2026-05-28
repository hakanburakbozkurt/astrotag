export type PlanetId =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn";

export type AspectType = "conjunction" | "opposition" | "square" | "trine";

export interface PlanetPosition {
  id: PlanetId;
  name: string;
  symbol: string;
  longitude: number;
  signIndex: number;
  signName: string;
  degreeInSign: number;
  label: string;
  cardLabel: string;
  house: number;
}

export interface BirthCoordinates {
  latitude: number;
  longitude: number;
  timezone: string;
  displayName: string;
}

export interface AscendantInfo {
  longitude: number;
  signIndex: number;
  signName: string;
  degreeInSign: number;
  label: string;
}

export interface Aspect {
  id: string;
  planetA: PlanetId;
  planetB: PlanetId;
  type: AspectType;
  typeLabel: string;
  angle: number;
  orb: number;
}

export interface HouseCusp {
  house: number;
  longitude: number;
  signName: string;
  label: string;
}

export interface NatalChartData {
  birthUtc: Date;
  coordinates: BirthCoordinates;
  ascendant: AscendantInfo;
  houses: HouseCusp[];
  planets: PlanetPosition[];
  aspects: Aspect[];
}

export interface NatalChartSummary {
  meta: {
    birthUtc: string;
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  ascendant: AscendantInfo;
  planets: Array<{
    id: PlanetId;
    name: string;
    longitude: number;
    sign: string;
    degreeInSign: number;
    label: string;
    house: number;
  }>;
  aspects: Array<{
    planetA: PlanetId;
    planetB: PlanetId;
    type: AspectType;
    typeLabel: string;
    angle: number;
    orb: number;
  }>;
  houses: HouseCusp[];
}

export interface BirthContext {
  birthUtc: Date;
  coordinates: BirthCoordinates;
}
