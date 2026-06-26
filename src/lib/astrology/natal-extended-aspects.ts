import type { Aspect, ChartBodyId, ExtendedAspectType } from "./types";
import { normalizeLongitude } from "./zodiac";

const MAJOR_ASPECT_RULES: Array<{
  type: ExtendedAspectType;
  typeLabel: string;
  angle: number;
  orb: number;
}> = [
  { type: "conjunction", typeLabel: "Kavuşum", angle: 0, orb: 8 },
  { type: "opposition", typeLabel: "Karşıt", angle: 180, orb: 8 },
  { type: "square", typeLabel: "Kare", angle: 90, orb: 8 },
  { type: "trine", typeLabel: "Üçgen", angle: 120, orb: 8 },
];

const MINOR_ASPECT_RULES: Array<{
  type: ExtendedAspectType;
  typeLabel: string;
  angle: number;
  orb: number;
}> = [
  { type: "sextile", typeLabel: "Sekstil", angle: 60, orb: 6 },
  { type: "quincunx", typeLabel: "Quincunx", angle: 150, orb: 3 },
];

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeLongitude(a) - normalizeLongitude(b));
  return Math.min(diff, 360 - diff);
}

function detectAspectsForBodies(
  bodies: Array<{ id: ChartBodyId; longitude: number }>,
  rules: typeof MAJOR_ASPECT_RULES,
  isMinor: boolean
): Aspect[] {
  const aspects: Aspect[] = [];

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const bodyA = bodies[i];
      const bodyB = bodies[j];
      const separation = angularDistance(bodyA.longitude, bodyB.longitude);

      for (const rule of rules) {
        const orb = Math.abs(separation - rule.angle);
        if (orb <= rule.orb) {
          aspects.push({
            id: `${bodyA.id}-${bodyB.id}-${rule.type}`,
            planetA: bodyA.id,
            planetB: bodyB.id,
            type: rule.type,
            typeLabel: rule.typeLabel,
            angle: rule.angle,
            orb: Number(orb.toFixed(2)),
            isMinor,
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

export function calculateMajorAspectsForBodies(
  bodies: Array<{ id: ChartBodyId; longitude: number }>
): Aspect[] {
  return detectAspectsForBodies(bodies, MAJOR_ASPECT_RULES, false);
}

export function calculateExtendedAspectsForBodies(
  bodies: Array<{ id: ChartBodyId; longitude: number }>
): Aspect[] {
  const major = detectAspectsForBodies(bodies, MAJOR_ASPECT_RULES, false);
  const minor = detectAspectsForBodies(bodies, MINOR_ASPECT_RULES, true);
  return [...major, ...minor].sort((a, b) => a.orb - b.orb);
}

export const EXTENDED_ASPECT_COLORS: Record<ExtendedAspectType, string> = {
  conjunction: "rgba(251,191,36,0.75)",
  trine: "rgba(59,130,246,0.7)",
  square: "rgba(239,68,68,0.72)",
  opposition: "rgba(168,85,247,0.68)",
  sextile: "rgba(34,197,94,0.62)",
  quincunx: "rgba(148,163,184,0.55)",
};

export const EXTENDED_ASPECT_LEGEND = [
  { type: "conjunction" as const, label: "Kavuşum", color: EXTENDED_ASPECT_COLORS.conjunction },
  { type: "trine" as const, label: "Üçgen", color: EXTENDED_ASPECT_COLORS.trine },
  { type: "square" as const, label: "Kare", color: EXTENDED_ASPECT_COLORS.square },
  { type: "opposition" as const, label: "Karşıt", color: EXTENDED_ASPECT_COLORS.opposition },
  { type: "sextile" as const, label: "Sekstil", color: EXTENDED_ASPECT_COLORS.sextile },
  { type: "quincunx" as const, label: "Quincunx", color: EXTENDED_ASPECT_COLORS.quincunx },
] as const;
