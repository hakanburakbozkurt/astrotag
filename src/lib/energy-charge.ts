import {
  MAX_COSMIC_ENERGY,
  SESSION_DURATION_HOURS,
} from "@/lib/constants/cosmic";

export interface EnergyChargeState {
  energy: number;
  energyBonus: number;
  totalEnergy: number;
  lastEnergyCharge: string | null;
  canCharge: boolean;
  isFull: boolean;
  nextChargeAt: string | null;
}

export function getTotalEnergy(cosmicEnergy: number, energyBonus: number): number {
  return cosmicEnergy + energyBonus;
}

export function deductEnergyBalance(
  cosmicEnergy: number,
  energyBonus: number,
  amount: number
): { cosmicEnergy: number; energyBonus: number } {
  const fromCosmic = Math.min(cosmicEnergy, amount);
  const remaining = amount - fromCosmic;

  return {
    cosmicEnergy: cosmicEnergy - fromCosmic,
    energyBonus: energyBonus - remaining,
  };
}

export function getNextChargeAt(
  lastEnergyCharge: string | null | undefined
): string | null {
  if (!lastEnergyCharge) {
    return null;
  }

  const nextMs =
    new Date(lastEnergyCharge).getTime() +
    SESSION_DURATION_HOURS * 60 * 60 * 1000;

  if (nextMs <= Date.now()) {
    return null;
  }

  return new Date(nextMs).toISOString();
}

export function canChargeEnergy(
  cosmicEnergy: number,
  lastEnergyCharge: string | null | undefined
): boolean {
  if (cosmicEnergy >= MAX_COSMIC_ENERGY) {
    return false;
  }

  return getNextChargeAt(lastEnergyCharge) === null;
}

export function buildEnergyChargeState(
  cosmicEnergy: number,
  energyBonus: number,
  lastEnergyCharge: string | null | undefined
): EnergyChargeState {
  const isFull = cosmicEnergy >= MAX_COSMIC_ENERGY;
  const nextChargeAt = isFull ? null : getNextChargeAt(lastEnergyCharge);

  return {
    energy: cosmicEnergy,
    energyBonus,
    totalEnergy: getTotalEnergy(cosmicEnergy, energyBonus),
    lastEnergyCharge: lastEnergyCharge ?? null,
    canCharge: !isFull && nextChargeAt === null,
    isFull,
    nextChargeAt,
  };
}
