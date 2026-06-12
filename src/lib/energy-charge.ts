import {
  MAX_STAR_POINTS,
  SESSION_DURATION_HOURS,
} from "@/lib/constants/cosmic";

export interface StarPointsChargeState {
  starPoints: number;
  starPointsBonus: number;
  totalStarPoints: number;
  lastStarPointsCharge: string | null;
  canCharge: boolean;
  isFull: boolean;
  nextChargeAt: string | null;
}

/** @deprecated Use StarPointsChargeState */
export type EnergyChargeState = StarPointsChargeState;

export function getTotalStarPoints(
  starPoints: number,
  starPointsBonus: number
): number {
  return starPoints + starPointsBonus;
}

/** @deprecated Use getTotalStarPoints */
export const getTotalEnergy = getTotalStarPoints;

export function deductStarPointsBalance(
  starPoints: number,
  starPointsBonus: number,
  amount: number
): { starPoints: number; starPointsBonus: number } {
  const fromStarPoints = Math.min(starPoints, amount);
  const remaining = amount - fromStarPoints;

  return {
    starPoints: starPoints - fromStarPoints,
    starPointsBonus: starPointsBonus - remaining,
  };
}

/** @deprecated Use deductStarPointsBalance */
export function deductEnergyBalance(
  cosmicEnergy: number,
  energyBonus: number,
  amount: number
): { cosmicEnergy: number; energyBonus: number } {
  const next = deductStarPointsBalance(cosmicEnergy, energyBonus, amount);
  return {
    cosmicEnergy: next.starPoints,
    energyBonus: next.starPointsBonus,
  };
}

export function getNextChargeAt(
  lastStarPointsCharge: string | null | undefined
): string | null {
  if (!lastStarPointsCharge) {
    return null;
  }

  const nextMs =
    new Date(lastStarPointsCharge).getTime() +
    SESSION_DURATION_HOURS * 60 * 60 * 1000;

  if (nextMs <= Date.now()) {
    return null;
  }

  return new Date(nextMs).toISOString();
}

export function canChargeStarPoints(
  starPoints: number,
  lastStarPointsCharge: string | null | undefined
): boolean {
  if (starPoints >= MAX_STAR_POINTS) {
    return false;
  }

  return getNextChargeAt(lastStarPointsCharge) === null;
}

/** @deprecated Use canChargeStarPoints */
export const canChargeEnergy = canChargeStarPoints;

export function buildStarPointsChargeState(
  starPoints: number,
  starPointsBonus: number,
  lastStarPointsCharge: string | null | undefined
): StarPointsChargeState {
  const isFull = starPoints >= MAX_STAR_POINTS;
  const nextChargeAt = isFull ? null : getNextChargeAt(lastStarPointsCharge);

  return {
    starPoints,
    starPointsBonus,
    totalStarPoints: getTotalStarPoints(starPoints, starPointsBonus),
    lastStarPointsCharge: lastStarPointsCharge ?? null,
    canCharge: !isFull && nextChargeAt === null,
    isFull,
    nextChargeAt,
  };
}

/** @deprecated Use buildStarPointsChargeState */
export function buildEnergyChargeState(
  cosmicEnergy: number,
  energyBonus: number,
  lastEnergyCharge: string | null | undefined
): EnergyChargeState {
  return buildStarPointsChargeState(cosmicEnergy, energyBonus, lastEnergyCharge);
}
