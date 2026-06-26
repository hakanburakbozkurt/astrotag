import type { AspectType, PlanetId } from "@/lib/astrology/types";
import { normalizeLongitude } from "@/lib/astrology/zodiac";
import {
  buildSynastryInsightLine as buildMatchInsightLine,
  buildSynastryMatchPresentation,
} from "@/lib/synastry/synastry-match-logic";

export type OrbStrengthTier = "strong" | "supportive" | "weak";

export type SynastryAspectMatch = {
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

const ASPECT_DEFINITIONS: Array<{
  type: AspectType;
  typeLabel: string;
  angle: number;
}> = [
  { type: "conjunction", typeLabel: "Kavuşum", angle: 0 },
  { type: "opposition", typeLabel: "Karşıt", angle: 180 },
  { type: "square", typeLabel: "Kare", angle: 90 },
  { type: "trine", typeLabel: "Üçgen", angle: 120 },
];

export function angularSeparation(longitudeA: number, longitudeB: number): number {
  const diff = Math.abs(normalizeLongitude(longitudeA) - normalizeLongitude(longitudeB));
  return Math.min(diff, 360 - diff);
}

/** 0–2° Güçlü, 2–4° Destekleyici, 4°+ Zayıf */
export function classifyOrbStrength(orb: number): {
  tier: OrbStrengthTier;
  label: string;
} {
  if (orb <= 2) {
    return { tier: "strong", label: "Güçlü Uyum" };
  }

  if (orb <= 4) {
    return { tier: "supportive", label: "Destekleyici Etki" };
  }

  return { tier: "weak", label: "Zayıf/Düşük Etki" };
}

/**
 * Üçgen doğrulama — mutlak ekliptik derece farkı.
 * Kavuşum (0°) ile üçgen (120°) karışmasın: separation >= 55° şartı.
 */
export function isValidTrineSeparation(
  separation: number,
  maxOrb: number
): boolean {
  if (separation < 55) {
    return false;
  }

  const orbTo120 = Math.abs(separation - 120);
  const harmonicRemainder = separation % 120;
  const mod120Distance = Math.min(harmonicRemainder, 120 - harmonicRemainder);

  return orbTo120 <= maxOrb && mod120Distance <= maxOrb;
}

function orbForAspect(type: AspectType, separation: number): number {
  if (type === "conjunction") {
    return Number(separation.toFixed(2));
  }

  const target =
    ASPECT_DEFINITIONS.find((rule) => rule.type === type)?.angle ?? separation;

  return Number(Math.abs(separation - target).toFixed(2));
}

function matchesAspect(
  type: AspectType,
  separation: number,
  maxOrb: number
): boolean {
  switch (type) {
    case "conjunction":
      return separation <= maxOrb;
    case "opposition":
      return Math.abs(separation - 180) <= maxOrb;
    case "square":
      return Math.abs(separation - 90) <= maxOrb;
    case "trine":
      return isValidTrineSeparation(separation, maxOrb);
    default:
      return false;
  }
}

export function detectSynastryCrossAspect(params: {
  userLongitude: number;
  partnerLongitude: number;
  userPlanetId: PlanetId;
  partnerPlanetId: PlanetId;
  maxOrb?: number;
}): SynastryAspectMatch | null {
  const maxOrb = params.maxOrb ?? 8;
  const samePlanetPair = params.userPlanetId === params.partnerPlanetId;
  const effectiveMaxOrb = samePlanetPair ? Math.min(maxOrb, 6) : maxOrb;
  const separation = angularSeparation(
    params.userLongitude,
    params.partnerLongitude
  );

  for (const rule of ASPECT_DEFINITIONS) {
    if (!matchesAspect(rule.type, separation, effectiveMaxOrb)) {
      continue;
    }

    const orb = orbForAspect(rule.type, separation);
    const { tier, label } = classifyOrbStrength(orb);

    const presentation = buildSynastryMatchPresentation({
      userPlanetId: params.userPlanetId,
      partnerPlanetId: params.partnerPlanetId,
      userBody: formatPlanetBody(params.userPlanetId),
      partnerBody: formatPlanetBody(params.partnerPlanetId),
      type: rule.type,
      typeLabel: rule.typeLabel,
      angle: rule.angle,
      orb,
      orbStrengthLabel: label,
      tier,
    });

    return {
      type: rule.type,
      typeLabel: rule.typeLabel,
      angle: rule.angle,
      orb,
      separation: Number(separation.toFixed(2)),
      orbStrength: tier,
      orbStrengthLabel: label,
      astroNote: presentation.planetEffect,
      samePlanetPair,
      aspectTitle: presentation.aspectTitle,
      planetEffect: presentation.planetEffect,
      aspectDetail: presentation.aspectDetail,
      orbTechnical: presentation.orbTechnical,
      isExactAspect: presentation.isExactAspect,
    };
  }

  return null;
}

const PLANET_BODY_LABEL: Record<PlanetId, string> = {
  sun: "Güneş",
  moon: "Ay",
  mercury: "Merkür",
  venus: "Venüs",
  mars: "Mars",
  jupiter: "Jüpiter",
  saturn: "Satürn",
};

function formatPlanetBody(planetId: PlanetId): string {
  return PLANET_BODY_LABEL[planetId];
}

export function buildSynastryInsightLine(params: {
  aspectTitle: string;
  aspectDetail: string;
  orbTechnical: string;
  planetEffect: string;
}): string {
  return buildMatchInsightLine(params);
}
