import type { Aspect, AspectType, PlanetId, PlanetPosition } from "./types";
import { normalizeLongitude } from "./zodiac";

const ASPECT_RULES: Array<{
  type: AspectType;
  typeLabel: string;
  angle: number;
  orb: number;
}> = [
  { type: "conjunction", typeLabel: "Kavuşum", angle: 0, orb: 8 },
  { type: "opposition", typeLabel: "Karşıt", angle: 180, orb: 8 },
  { type: "square", typeLabel: "Kare", angle: 90, orb: 8 },
  { type: "trine", typeLabel: "Üçgen", angle: 120, orb: 8 },
];

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeLongitude(a) - normalizeLongitude(b));
  return Math.min(diff, 360 - diff);
}

export function calculateAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];

  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const planetA = planets[i];
      const planetB = planets[j];
      const separation = angularDistance(planetA.longitude, planetB.longitude);

      for (const rule of ASPECT_RULES) {
        const orb = Math.abs(separation - rule.angle);
        if (orb <= rule.orb) {
          aspects.push({
            id: `${planetA.id}-${planetB.id}-${rule.type}`,
            planetA: planetA.id,
            planetB: planetB.id,
            type: rule.type,
            typeLabel: rule.typeLabel,
            angle: rule.angle,
            orb: Number(orb.toFixed(2)),
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

export function calculateCrossAspects(
  longitudesA: Array<{ id: PlanetId; name: string; longitude: number; side: string }>,
  longitudesB: Array<{ id: PlanetId; name: string; longitude: number; side: string }>
): Array<{
  bodyA: string;
  bodyB: string;
  type: AspectType;
  typeLabel: string;
  angle: number;
  orb: number;
}> {
  const results: Array<{
    bodyA: string;
    bodyB: string;
    type: AspectType;
    typeLabel: string;
    angle: number;
    orb: number;
  }> = [];

  for (const a of longitudesA) {
    for (const b of longitudesB) {
      const separation = angularDistance(a.longitude, b.longitude);

      for (const rule of ASPECT_RULES) {
        const orb = Math.abs(separation - rule.angle);
        if (orb <= rule.orb) {
          results.push({
            bodyA: `${a.side}:${a.name}`,
            bodyB: `${b.side}:${b.name}`,
            type: rule.type,
            typeLabel: rule.typeLabel,
            angle: rule.angle,
            orb: Number(orb.toFixed(2)),
          });
          break;
        }
      }
    }
  }

  return results.sort((left, right) => left.orb - right.orb);
}

export const ASPECT_COLORS: Record<AspectType, string> = {
  conjunction: "rgba(251,191,36,0.75)",
  trine: "rgba(59,130,246,0.7)",
  square: "rgba(239,68,68,0.72)",
  opposition: "rgba(168,85,247,0.68)",
};

export function aspectPlanetIds(aspects: Aspect[]): Set<PlanetId> {
  return new Set(
    aspects.flatMap((aspect) => [aspect.planetA, aspect.planetB])
  );
}
