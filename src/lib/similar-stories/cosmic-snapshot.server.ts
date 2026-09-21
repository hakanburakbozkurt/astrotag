import "server-only";

import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { detectCosmicTensions } from "@/lib/astrology/emph-processing-engine";
import { longitudeToSign } from "@/lib/astrology/zodiac";
import type { UserData } from "@/types/user";
import type { FeedCosmicSnapshot } from "@/lib/similar-stories/similar-stories.shared";

function planetSign(
  planets: Array<{ id: string; longitude: number }>,
  id: string
): string | null {
  const planet = planets.find((row) => row.id === id);
  if (!planet) {
    return null;
  }
  return longitudeToSign(planet.longitude).signName;
}

function buildTransitAspectKey(aspect: {
  bodyA: string;
  bodyB: string;
  type: string;
}): string {
  return `${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`;
}

function buildDominantTransitLabel(
  aspects: Array<{ bodyA: string; bodyB: string; typeLabel: string; orb: number }>
): string | null {
  const hard = aspects.filter(
    (aspect) =>
      (aspect.typeLabel === "Kare" || aspect.typeLabel === "Karşıt") &&
      aspect.orb <= 5
  );

  const top = hard[0] ?? aspects[0];
  if (!top) {
    return null;
  }

  const transitBody = top.bodyA.startsWith("transit:")
    ? top.bodyA.replace("transit:", "")
    : top.bodyB.replace("natal:", "");

  const natalBody = top.bodyB.startsWith("natal:")
    ? top.bodyB.replace("natal:", "")
    : top.bodyA.replace("transit:", "");

  return `${transitBody} · ${natalBody} ${top.typeLabel.toLowerCase()}`;
}

export function hasCompleteBirthProfileForCosmic(profile: UserData): boolean {
  return Boolean(
    profile.birthDate?.trim() &&
      profile.birthTime?.trim() &&
      profile.birthPlace?.trim()
  );
}

export async function buildFeedCosmicSnapshot(
  profile: UserData,
  askedAt: Date = new Date()
): Promise<FeedCosmicSnapshot | null> {
  if (!hasCompleteBirthProfileForCosmic(profile)) {
    return null;
  }

  const context = await buildCosmicAnalysisContext(profile, askedAt);
  const tensions = detectCosmicTensions(context);
  const natalPlanets = context.natal.planets.map((planet) => ({
    id: planet.id,
    longitude: planet.longitude,
  }));

  const sunSign = planetSign(natalPlanets, "sun");
  const moonSign = planetSign(natalPlanets, "moon");
  const skyMoonSign = planetSign(context.transits.planets, "moon");

  if (!sunSign || !moonSign || !skyMoonSign) {
    return null;
  }

  const hardAspects = context.transits.aspectsToNatal.filter(
    (aspect) =>
      (aspect.type === "square" || aspect.type === "opposition") && aspect.orb <= 5
  );

  const transitAspectKeys = hardAspects
    .slice(0, 8)
    .map((aspect) => buildTransitAspectKey(aspect));

  return {
    capturedAt: askedAt.toISOString(),
    natal: {
      sunSign,
      moonSign,
      risingSign: context.natal.ascendant.signName,
    },
    sky: {
      moonSign: skyMoonSign,
    },
    tensionIds: tensions.map((tension) => tension.id),
    transitAspectKeys,
    dominantTransitLabel: buildDominantTransitLabel(hardAspects),
  };
}
