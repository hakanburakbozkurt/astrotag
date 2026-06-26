import type { AspectType, PlanetId } from "@/lib/astrology/types";
import { planetHouse } from "@/lib/astrology/ascendant";
import { angularSeparation } from "@/lib/synastry/synastry-aspect-engine";
import type {
  SynastryAspectLine,
  SynastryCalculationResult,
} from "@/lib/synastry/synastry-calculation";

const BASE_SCORE = 50;
const MIN_SCORE = 1;
const MAX_SCORE = 100;

const ASPECT_DELTAS: Record<AspectType, number> = {
  trine: 10,
  conjunction: 8,
  square: -5,
  opposition: -4,
};

const ORB_MULTIPLIERS = {
  strong: 1.5,
  supportive: 1.0,
  weak: 0.5,
} as const;

const RELATIONSHIP_HOUSES = new Set([5, 7]);
const INTENSITY_HOUSES = new Set([8, 12]);

/** Skora yalnızca en sıkı N aspect girer — 49 çiftin tamamını toplamak skoru 100'e kilitler. */
const MAX_SCORING_ASPECTS = 8;
const ASPECT_DELTA_CAP = 32;
const HOUSE_DELTA_CAP = 12;
const ASCENDANT_DELTA_CAP = 10;

const HOUSE_SCORING_PLANETS = new Set<PlanetId>([
  "sun",
  "moon",
  "venus",
  "mars",
]);

export type SynastryScoreTone = "harmonious" | "mixed" | "challenging";

export interface SynastryScoreBreakdownItem {
  source: "aspect" | "house" | "ascendant";
  label: string;
  delta: number;
  detail: string;
}

export interface SynastryHouseOverlayFact {
  guestPlanet: string;
  guestPlanetId: PlanetId;
  host: "user" | "partner";
  house: number;
  delta: number;
  note: string;
}

export interface SynastryScoreAspectFact {
  aspectTitle: string;
  type: AspectType;
  typeLabel: string;
  orb: number;
  orbStrengthLabel: string;
  delta: number;
  planetEffect: string;
}

export interface SynastryScoreAnalysis {
  score: number;
  baseScore: number;
  totalDelta: number;
  tone: SynastryScoreTone;
  breakdown: SynastryScoreBreakdownItem[];
  aspectFacts: SynastryScoreAspectFact[];
  houseOverlays: SynastryHouseOverlayFact[];
  ascendantNote: string | null;
  algorithmSummary: string;
}

function clampScore(value: number): number {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(value)));
}

function capDelta(delta: number, cap: number): number {
  return Math.max(-cap, Math.min(cap, delta));
}

function isSynastryScoreDebugEnabled(): boolean {
  return process.env.SYNASTRY_SCORE_DEBUG === "true";
}

export function debugSynastryScore(message: string, payload?: unknown): void {
  if (!isSynastryScoreDebugEnabled()) {
    return;
  }

  if (payload !== undefined) {
    console.log(`[synastry-score] ${message}`, payload);
    return;
  }

  console.log(`[synastry-score] ${message}`);
}

export function buildSynastryScoreFingerprint(input: {
  partnerBirthDate?: string | null;
  partnerBirthTime?: string | null;
  partnerBirthPlace?: string | null;
}): string {
  return [
    input.partnerBirthDate?.trim() ?? "",
    input.partnerBirthTime?.trim() ?? "",
    input.partnerBirthPlace?.trim() ?? "",
  ].join("|");
}

function selectScoringAspects(
  aspectLines: SynastryAspectLine[]
): SynastryAspectLine[] {
  return [...aspectLines].sort((a, b) => a.orb - b.orb).slice(0, MAX_SCORING_ASPECTS);
}

function orbMultiplier(tier: SynastryAspectLine["orbStrength"]): number {
  return ORB_MULTIPLIERS[tier];
}

function scoreAspects(aspectLines: SynastryAspectLine[]): {
  delta: number;
  breakdown: SynastryScoreBreakdownItem[];
  aspectFacts: SynastryScoreAspectFact[];
} {
  const breakdown: SynastryScoreBreakdownItem[] = [];
  const aspectFacts: SynastryScoreAspectFact[] = [];
  let delta = 0;

  for (const aspect of aspectLines) {
    const baseDelta = ASPECT_DELTAS[aspect.type];
    const weightedDelta = Number(
      (baseDelta * orbMultiplier(aspect.orbStrength)).toFixed(1)
    );

    delta += weightedDelta;
    aspectFacts.push({
      aspectTitle: aspect.aspectTitle,
      type: aspect.type,
      typeLabel: aspect.typeLabel,
      orb: aspect.orb,
      orbStrengthLabel: aspect.orbStrengthLabel,
      delta: weightedDelta,
      planetEffect: aspect.planetEffect,
    });

    breakdown.push({
      source: "aspect",
      label: aspect.aspectTitle,
      delta: weightedDelta,
      detail: `${aspect.typeLabel} · ${aspect.orbTechnical}`,
    });
  }

  return { delta, breakdown, aspectFacts };
}

function houseOverlayDelta(
  planetId: PlanetId,
  house: number
): { delta: number; note: string } | null {
  const isVenusOrMoon = planetId === "venus" || planetId === "moon";
  const isSun = planetId === "sun";
  const isMarsOrSaturn = planetId === "mars" || planetId === "saturn";

  if (RELATIONSHIP_HOUSES.has(house) && (isVenusOrMoon || isSun)) {
    return {
      delta: 5,
      note: `${house}. evde ilişki/çekim alanı güçleniyor`,
    };
  }

  if (RELATIONSHIP_HOUSES.has(house) && isMarsOrSaturn) {
    return {
      delta: -3,
      note: `${house}. evde gerilim veya sınır teması`,
    };
  }

  if (INTENSITY_HOUSES.has(house) && isMarsOrSaturn) {
    return {
      delta: -2,
      note: `${house}. evde yoğun dönüşüm baskısı`,
    };
  }

  return null;
}

function scoreHouseOverlays(data: SynastryCalculationResult): {
  delta: number;
  breakdown: SynastryScoreBreakdownItem[];
  houseOverlays: SynastryHouseOverlayFact[];
} {
  const breakdown: SynastryScoreBreakdownItem[] = [];
  const houseOverlays: SynastryHouseOverlayFact[] = [];
  let delta = 0;

  for (const partnerPlanet of data.partnerPlanets) {
    if (!HOUSE_SCORING_PLANETS.has(partnerPlanet.id)) {
      continue;
    }

    const house = planetHouse(partnerPlanet.longitude, data.userAscendant);
    const overlay = houseOverlayDelta(partnerPlanet.id, house);

    if (!overlay) {
      continue;
    }

    delta += overlay.delta;
    houseOverlays.push({
      guestPlanet: partnerPlanet.name,
      guestPlanetId: partnerPlanet.id,
      host: "user",
      house,
      delta: overlay.delta,
      note: overlay.note,
    });

    breakdown.push({
      source: "house",
      label: `Partner ${partnerPlanet.name} → Senin ${house}. evin`,
      delta: overlay.delta,
      detail: overlay.note,
    });
  }

  for (const userPlanet of data.userPlanets) {
    if (!HOUSE_SCORING_PLANETS.has(userPlanet.id)) {
      continue;
    }

    const house = planetHouse(userPlanet.longitude, data.partnerAscendant);
    const overlay = houseOverlayDelta(userPlanet.id, house);

    if (!overlay) {
      continue;
    }

    delta += overlay.delta;
    houseOverlays.push({
      guestPlanet: userPlanet.name,
      guestPlanetId: userPlanet.id,
      host: "partner",
      house,
      delta: overlay.delta,
      note: overlay.note,
    });

    breakdown.push({
      source: "house",
      label: `Senin ${userPlanet.name} → Partner ${house}. evi`,
      delta: overlay.delta,
      detail: overlay.note,
    });
  }

  return { delta, breakdown, houseOverlays };
}

function scoreAscendantHarmony(data: SynastryCalculationResult): {
  delta: number;
  breakdown: SynastryScoreBreakdownItem | null;
  ascendantNote: string | null;
} {
  const separation = angularSeparation(data.userAscendant, data.partnerAscendant);

  if (separation <= 10) {
    return {
      delta: 8,
      breakdown: {
        source: "ascendant",
        label: "Yükselen Kavuşumu",
        delta: 8,
        detail: `Yükselenler ${separation.toFixed(1)}° yakın — güçlü vitrin uyumu`,
      },
      ascendantNote: "Yükselen kavuşumu ilişkiye doğal bir akış katar.",
    };
  }

  if (separation >= 115 && separation <= 125) {
    return {
      delta: 10,
      breakdown: {
        source: "ascendant",
        label: "Yükselen Üçgeni",
        delta: 10,
        detail: `Yükselenler ${separation.toFixed(1)}° — destekleyici yaşam ritmi`,
      },
      ascendantNote: "Yükselen üçgeni günlük uyumu kolaylaştırır.",
    };
  }

  if (separation >= 85 && separation <= 95) {
    return {
      delta: -4,
      breakdown: {
        source: "ascendant",
        label: "Yükselen Karesi",
        delta: -4,
        detail: `Yükselenler ${separation.toFixed(1)}° — farklı tempo gerilimi`,
      },
      ascendantNote: "Yükselen karesi farklı hızları dengelemeyi gerektirir.",
    };
  }

  if (separation >= 170 && separation <= 190) {
    return {
      delta: -3,
      breakdown: {
        source: "ascendant",
        label: "Yükselen Karşıtlığı",
        delta: -3,
        detail: `Yükselenler ${separation.toFixed(1)}° — çekim + denge arayışı`,
      },
      ascendantNote: "Yükselen karşıtlığı manyetik ama denge isteyen bir dinamik taşır.",
    };
  }

  return { delta: 0, breakdown: null, ascendantNote: null };
}

function resolveTone(score: number, aspectFacts: SynastryScoreAspectFact[]): SynastryScoreTone {
  const hardCount = aspectFacts.filter(
    (fact) => fact.type === "square" || fact.type === "opposition"
  ).length;
  const softCount = aspectFacts.filter(
    (fact) => fact.type === "trine" || fact.type === "conjunction"
  ).length;

  if (score >= 68 && softCount >= hardCount) {
    return "harmonious";
  }

  if (score <= 42 || hardCount > softCount + 1) {
    return "challenging";
  }

  return "mixed";
}

function buildAlgorithmSummary(
  score: number,
  tone: SynastryScoreTone,
  aspectFacts: SynastryScoreAspectFact[],
  data: SynastryCalculationResult
): string {
  const topAspect = aspectFacts.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  if (!topAspect) {
    return `${data.userName} ve ${data.partnerName} için algoritmik uyum ${score}/100 — belirgin cross-aspect az; ev yerleşimleri ve transitler ön planda.`;
  }

  const toneLabel =
    tone === "harmonious"
      ? "destekleyici"
      : tone === "challenging"
        ? "gerilimli"
        : "karışık";

  return `${data.userName} ve ${data.partnerName} için algoritmik uyum ${score}/100 (${toneLabel}). Öne çıkan: ${topAspect.aspectTitle} (${topAspect.orbStrengthLabel}).`;
}

/**
 * SynastryCalculation çıktısından kural tabanlı uyum skoru üretir.
 * Skor astronomy-engine + synastry-aspect-engine verisine dayanır; Oracle narration skor hesaplamaz.
 */
export function calculateSynastryScore(
  data: SynastryCalculationResult
): SynastryScoreAnalysis {
  const scoringAspectLines = selectScoringAspects(data.aspectLines);
  const aspectScoring = scoreAspects(scoringAspectLines);
  const houseScoring = scoreHouseOverlays(data);
  const ascendantScoring = scoreAscendantHarmony(data);

  const rawAspectDelta = aspectScoring.delta;
  const rawHouseDelta = houseScoring.delta;
  const rawAscendantDelta = ascendantScoring.delta;

  const aspectDelta = capDelta(rawAspectDelta, ASPECT_DELTA_CAP);
  const houseDelta = capDelta(rawHouseDelta, HOUSE_DELTA_CAP);
  const ascendantDelta = capDelta(rawAscendantDelta, ASCENDANT_DELTA_CAP);

  const breakdown = [
    ...aspectScoring.breakdown,
    ...houseScoring.breakdown,
    ...(ascendantScoring.breakdown ? [ascendantScoring.breakdown] : []),
  ];

  const totalDelta = aspectDelta + houseDelta + ascendantDelta;
  const score = clampScore(BASE_SCORE + totalDelta);
  const tone = resolveTone(score, aspectScoring.aspectFacts);

  debugSynastryScore("calculateSynastryScore", {
    userName: data.userName,
    partnerName: data.partnerName,
    totalAspectsDetected: data.aspectLines.length,
    aspectsUsedForScore: scoringAspectLines.length,
    rawAspectDelta,
    rawHouseDelta,
    rawAscendantDelta,
    cappedAspectDelta: aspectDelta,
    cappedHouseDelta: houseDelta,
    cappedAscendantDelta: ascendantDelta,
    totalDelta,
    score,
  });

  return {
    score,
    baseScore: BASE_SCORE,
    totalDelta: Number(totalDelta.toFixed(1)),
    tone,
    breakdown,
    aspectFacts: aspectScoring.aspectFacts,
    houseOverlays: houseScoring.houseOverlays,
    ascendantNote: ascendantScoring.ascendantNote,
    algorithmSummary: buildAlgorithmSummary(
      score,
      tone,
      aspectScoring.aspectFacts,
      data
    ),
  };
}
