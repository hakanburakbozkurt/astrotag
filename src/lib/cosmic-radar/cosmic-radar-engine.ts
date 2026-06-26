import { calculateCrossAspects } from "@/lib/astrology/aspects";
import type { NatalChartData } from "@/lib/astrology/types";
import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";
import { getCurrentWeekRange } from "./week-range";
import {
  planetsInSign,
  snapshotTransitPlanets,
  type TransitPlanetSnapshot,
} from "./transit-snapshot";
import { annotateTransitsForSign } from "./sign-ascendant";
import { buildCautionIntro, getDeepStrategy } from "./sign-persona";
import type { WeeklyAnalysisContent, WeeklyTransitRow } from "./types";
import { TRANSIT_PLANET_SYMBOLS } from "./planet-symbols";
import {
  buildWeeklyOverviewNarrative,
  narrativeToCopyText,
  transitRowsToGridText,
} from "./weekly-narrative";

const HARSH_TYPES = new Set(["square", "opposition"]);
const SUPPORT_TYPES = new Set(["trine", "conjunction"]);

function formatAspectLine(aspect: {
  bodyA: string;
  bodyB: string;
  typeLabel: string;
  orb: number;
}): string {
  const cleanA = aspect.bodyA.replace(/^[^:]+:/, "");
  const cleanB = aspect.bodyB.replace(/^[^:]+:/, "");
  return `Transit ${cleanA} ${aspect.typeLabel.toLowerCase()} natal ${cleanB} (orb ${aspect.orb.toFixed(1)}°)`;
}

function buildTransitRows(
  transits: TransitPlanetSnapshot[],
  sign: ZodiacSign
): WeeklyTransitRow[] {
  return annotateTransitsForSign(transits, sign).map((planet) => ({
    id: planet.id,
    name: planet.name,
    symbol: TRANSIT_PLANET_SYMBOLS[planet.id],
    positionLabel: planet.label,
    house: planet.house,
    houseLabel: `${planet.house}. Ev`,
    inSelectedSign: planet.signName === sign,
  }));
}

function pickFocalAspectLabel(
  natalChart: NatalChartData,
  transits: TransitPlanetSnapshot[]
): string | null {
  const natalBodies = natalChart.planets.map((planet) => ({
    id: planet.id,
    name: planet.name,
    longitude: planet.longitude,
    side: "natal",
  }));

  const transitBodies = transits.map((planet) => ({
    id: planet.id,
    name: planet.name,
    longitude: planet.zodiacDegree,
    side: "transit",
  }));

  const aspects = calculateCrossAspects(transitBodies, natalBodies);
  const focal =
    aspects.find((aspect) => HARSH_TYPES.has(aspect.type) && aspect.orb <= 5) ??
    aspects.find((aspect) => SUPPORT_TYPES.has(aspect.type) && aspect.orb <= 4);

  return focal ? formatAspectLine(focal) : null;
}

function buildCautionBody(
  sign: ZodiacSign,
  natalChart: NatalChartData,
  transits: TransitPlanetSnapshot[]
): { body: string; highlight: boolean } {
  const natalBodies = natalChart.planets.map((planet) => ({
    id: planet.id,
    name: planet.name,
    longitude: planet.longitude,
    side: "natal",
  }));

  const transitBodies = transits.map((planet) => ({
    id: planet.id,
    name: planet.name,
    longitude: planet.zodiacDegree,
    side: "transit",
  }));

  const aspects = calculateCrossAspects(transitBodies, natalBodies);
  const harsh = aspects
    .filter((aspect) => HARSH_TYPES.has(aspect.type) && aspect.orb <= 5)
    .slice(0, 4);

  const intro = buildCautionIntro(sign);
  const lines =
    harsh.length > 0
      ? harsh
          .map(
            (aspect) =>
              `• ${formatAspectLine(aspect)} — bu açılar sebebiyle temkinli olunması önerilebilir.`
          )
          .join("\n")
      : "• Bu hafta belirgin sert transit-natal açısı düşük düzeyde görünüyor; yine de kişisel tetikleyicilere dikkat edilmesi faydalı olabilir.";

  return {
    body: `${intro}\n\n${lines}`,
    highlight: harsh.length > 0,
  };
}

export function buildWeeklyAnalysis(params: {
  natalChart: NatalChartData;
  selectedSign: ZodiacSign;
  referenceDate?: Date;
}): WeeklyAnalysisContent {
  const { natalChart, selectedSign, referenceDate = new Date() } = params;
  const week = getCurrentWeekRange(referenceDate);
  const transits = snapshotTransitPlanets(referenceDate);
  const inSign = planetsInSign(transits, selectedSign);
  const transitRows = buildTransitRows(transits, selectedSign);
  const caution = buildCautionBody(selectedSign, natalChart, transits);
  const focalAspectLabel = pickFocalAspectLabel(natalChart, transits);

  const overview = buildWeeklyOverviewNarrative({
    sign: selectedSign,
    transitRows,
    focalAspectLabel,
    inSignNames: inSign.map((planet) => planet.name),
  });

  const gridText = transitRowsToGridText(transitRows, selectedSign);
  const strategyBody = getDeepStrategy(selectedSign);

  return {
    weekLabel: week.label,
    dateRangeLabel: week.dateRangeLabel,
    weekStart: week.start.toISOString(),
    weekEnd: week.end.toISOString(),
    selectedSign,
    computedAt: referenceDate.toISOString(),
    transitRows,
    overview,
    cards: [
      {
        id: "overview",
        title: "Haftalık Özet",
        body: [
          overview.introduction,
          overview.development,
          overview.strategicConclusion,
        ].join("\n\n"),
        paragraphs: overview,
        copyText: narrativeToCopyText(
          week.dateRangeLabel,
          selectedSign,
          overview,
          gridText
        ),
      },
      {
        id: "strategy",
        title: "Stratejik Odak",
        body: strategyBody,
        copyText: `${week.dateRangeLabel}\nStratejik Odak (${selectedSign})\n\n${strategyBody}`,
      },
    ],
    caution: {
      title: "Dikkat Edilmesi Gerekenler",
      body: caution.body,
      highlight: caution.highlight,
      copyText: `Dikkat Edilmesi Gerekenler (${selectedSign})\n${caution.body}`,
    },
  };
}

/** @deprecated buildWeeklyAnalysis kullanın */
export function buildCosmicRadarBulletin(params: {
  natalChart: NatalChartData;
  selectedSign: ZodiacSign;
  referenceDate?: Date;
}) {
  const weekly = buildWeeklyAnalysis(params);
  return {
    weekLabel: weekly.weekLabel,
    weekStart: weekly.weekStart,
    weekEnd: weekly.weekEnd,
    selectedSign: weekly.selectedSign,
    computedAt: weekly.computedAt,
    cards: weekly.cards.map((card) => ({
      ...card,
      id: card.id === "overview" ? ("sign-focus" as const) : ("sky-pulse" as const),
    })),
  };
}
