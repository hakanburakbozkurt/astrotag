import {
  MAX_STAR_POINTS,
  STAR_POINTS_PER_CHARGE,
} from "@/lib/constants/cosmic";
import {
  buildStarPointsChargeState,
  type StarPointsChargeState,
} from "@/lib/energy-charge";

export function applyOptimisticStarClaim(state: StarPointsChargeState): StarPointsChargeState {
  const nowIso = new Date().toISOString();
  const nextStarPoints = Math.min(state.starPoints + STAR_POINTS_PER_CHARGE, MAX_STAR_POINTS);

  return buildStarPointsChargeState(nextStarPoints, state.starPointsBonus, nowIso);
}

export function getStarFillPercent(starPoints: number): number {
  return Math.min(100, Math.round((starPoints / MAX_STAR_POINTS) * 100));
}

export function getStarClaimButtonLabel(input: {
  isClaiming: boolean;
  isFull: boolean;
  isOnCooldown: boolean;
  countdown: string;
}): string {
  if (input.isClaiming) {
    return "Yükleniyor...";
  }

  if (input.isFull) {
    return "Yıldızlar Dolu (100/100)";
  }

  if (input.isOnCooldown) {
    return `Sonraki: ${input.countdown}`;
  }

  return `Yıldız Topla (+${STAR_POINTS_PER_CHARGE})`;
}
