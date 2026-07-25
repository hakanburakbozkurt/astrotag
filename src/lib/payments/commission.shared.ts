/** 1 kristalin TL karşılığı (platform_settings ile override edilebilir) */
export const DEFAULT_CRYSTAL_UNIT_TRY = 2.5;

/** Platform komisyon oranı — uzman hakedişinden kesilir */
export const PLATFORM_COMMISSION_RATE = 0.2;

export type CommissionSplit = {
  grossTry: number;
  platformCommissionTry: number;
  expertPayoutTry: number;
  commissionRate: number;
};

export function computeCommissionSplit(
  grossTry: number,
  commissionRate: number = PLATFORM_COMMISSION_RATE
): CommissionSplit {
  const platformCommissionTry =
    Math.round(grossTry * commissionRate * 100) / 100;
  const expertPayoutTry =
    Math.round((grossTry - platformCommissionTry) * 100) / 100;

  return {
    grossTry,
    platformCommissionTry,
    expertPayoutTry,
    commissionRate,
  };
}

export function crystalsToTry(
  crystals: number,
  unitTry: number = DEFAULT_CRYSTAL_UNIT_TRY
): number {
  return Math.round(crystals * unitTry * 100) / 100;
}
