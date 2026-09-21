import { crystalsToTry, DEFAULT_CRYSTAL_UNIT_TRY } from "@/lib/payments/commission.shared";

export const MIN_CRYSTAL_PURCHASE = 10;
export const MAX_CRYSTAL_PURCHASE = 5000;

export function validateCrystalPurchaseAmount(value: number): string | null {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return "Geçerli bir kristal adedi girin.";
  }

  if (value < MIN_CRYSTAL_PURCHASE) {
    return `En az ${MIN_CRYSTAL_PURCHASE} kristal satın alabilirsiniz.`;
  }

  if (value > MAX_CRYSTAL_PURCHASE) {
    return `En fazla ${MAX_CRYSTAL_PURCHASE} kristal satın alabilirsiniz.`;
  }

  return null;
}

export function quoteCrystalPurchaseTry(
  crystals: number,
  unitTry: number = DEFAULT_CRYSTAL_UNIT_TRY
): number {
  return crystalsToTry(crystals, unitTry);
}

export { DEFAULT_CRYSTAL_UNIT_TRY };
