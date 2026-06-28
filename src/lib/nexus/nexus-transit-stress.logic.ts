import type { AspectType } from "@/lib/astrology/types";
import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";

export const HARSH_TRANSIT_TYPES: AspectType[] = ["square", "opposition"];
export const HARSH_TRANSIT_ORB_MAX = 4;

export const STRESS_HIGH_NOW_THRESHOLD = 3;
export const STRESS_HIGH_PEAK_THRESHOLD = 4;
export const STRESS_MODERATE_NOW_THRESHOLD = 1;
export const STRESS_MODERATE_PEAK_THRESHOLD = 2;

export interface CrossAspectHit {
  bodyA: string;
  bodyB: string;
  type: AspectType;
  orb: number;
}

export interface HarshTransitAnalysis {
  count: number;
  moonOnly: boolean;
}

function isHarshTransitAspect(aspect: { type: AspectType; orb: number }): boolean {
  return HARSH_TRANSIT_TYPES.includes(aspect.type) && aspect.orb <= HARSH_TRANSIT_ORB_MAX;
}

function isTransitMoonBody(body: string): boolean {
  return body === "transit:moon";
}

export function analyzeHarshCrossAspects(aspects: CrossAspectHit[]): HarshTransitAnalysis {
  const harsh = aspects.filter(isHarshTransitAspect);

  if (harsh.length === 0) {
    return { count: 0, moonOnly: false };
  }

  const moonOnly = harsh.every(
    (aspect) => isTransitMoonBody(aspect.bodyA) || isTransitMoonBody(aspect.bodyB)
  );

  return { count: harsh.length, moonOnly };
}

function qualifiesForHigh(count: number, threshold: number, moonOnly: boolean): boolean {
  if (count < threshold) {
    return false;
  }

  return !moonOnly;
}

export function resolveStressLevel(
  now: HarshTransitAnalysis,
  peak: HarshTransitAnalysis
): NexusTransitStress["stressLevel"] {
  if (
    qualifiesForHigh(now.count, STRESS_HIGH_NOW_THRESHOLD, now.moonOnly) ||
    qualifiesForHigh(peak.count, STRESS_HIGH_PEAK_THRESHOLD, peak.moonOnly)
  ) {
    return "high";
  }

  if (
    now.count >= STRESS_MODERATE_NOW_THRESHOLD ||
    peak.count >= STRESS_MODERATE_PEAK_THRESHOLD
  ) {
    return "moderate";
  }

  return "calm";
}

export function buildTransitStressCopy(input: {
  stressLevel: NexusTransitStress["stressLevel"];
  harshNow: number;
  peakTimeLabel: string;
  moonSign: string;
}): { tactic: string; skySummary: string; isStressed: boolean } {
  const isStressed = input.stressLevel === "high";

  if (input.stressLevel === "high") {
    return {
      isStressed: true,
      tactic: `Stres Uyarısı: ${input.peakTimeLabel}'da gökyüzü baskısı artıyor, sakin kal.`,
      skySummary: `${input.harshNow} sert transit açısı aktif · zirve ${input.peakTimeLabel}`,
    };
  }

  if (input.stressLevel === "moderate") {
    return {
      isStressed: false,
      tactic: "Gökyüzü biraz hareketli, bugünü daha esnek planla",
      skySummary: `${input.harshNow} sert transit açısı aktif · Ay hattı ${input.moonSign}`,
    };
  }

  return {
    isStressed: false,
    tactic: "Gökyüzü bugün nispeten yumuşak — odaklan ve akışa güven.",
    skySummary: `Transit baskısı düşük · Ay hattı ${input.moonSign}`,
  };
}
