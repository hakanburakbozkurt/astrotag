import "server-only";

import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import type { NatalChartSummary } from "@/lib/astrology/types";
import type { TarotReadingCard } from "@/lib/ai/tarot-pipeline-schemas";
import { formatPartnerDataForPrompt, formatUserDataForPrompt } from "@/lib/tarot/tarot-profile-server";
import { hasPartnerData, type UserData } from "@/types/user";

const SPREAD_POSITIONS = ["Sol", "Orta", "Sağ"] as const;

const SUIT_PLANET_MAP: Record<string, string> = {
  wands: "mars",
  cups: "venus",
  swords: "mercury",
  pentacles: "saturn",
  "major-arcana": "sun",
};

const SPREAD_ROLE: Record<(typeof SPREAD_POSITIONS)[number], string> = {
  Sol: "Kök neden ve geçmişten gelen enerji",
  Orta: "Şu anki kalbinin nabzı ve dönüm noktası",
  Sağ: "Yakın geleceğe uzanan yol ve tavsiye alanı",
};

export type EmphReadingMode = "tarot" | "horary";

export interface EmphCosmicTension {
  id: string;
  technicalNote: string;
  intuitiveHint: string;
}

export interface EmphTarotCardInsight {
  position: (typeof SPREAD_POSITIONS)[number];
  id: string;
  name: string;
  keywords: string[];
  spreadRole: string;
  symbolism: string;
  natalResonance: string;
  skyLink: string;
}

export interface EmphEnrichedPackage {
  engine: "emph";
  mode: EmphReadingMode;
  askedAt: string;
  question: string;
  profile: {
    userSummary: string;
    partnerSummary: string;
  };
  natalChart: NatalChartSummary;
  skyMoment: CosmicAnalysisContext["horaryMoment"];
  transitsToNatal: CosmicAnalysisContext["transits"]["aspectsToNatal"];
  synastry: CosmicAnalysisContext["synastry"];
  cosmicTensions: EmphCosmicTension[];
  tarotCards?: EmphTarotCardInsight[];
  narrativeSeeds: string[];
}

function extractSuitFromCardId(cardId: string): string {
  if (/^\d{2}-/.test(cardId) || cardId.includes("major")) {
    return "major-arcana";
  }
  const match = cardId.match(/^(wands|cups|swords|pentacles)-/);
  return match?.[1] ?? "major-arcana";
}

function findNatalPlanet(
  natal: NatalChartSummary,
  planetId: string
): NatalChartSummary["planets"][number] | undefined {
  return natal.planets.find((planet) => planet.id === planetId);
}

function buildSkyLinkForCard(
  card: TarotReadingCard,
  transits: CosmicAnalysisContext["transits"]["aspectsToNatal"]
): string {
  const suit = extractSuitFromCardId(card.id);
  const linkedPlanet = SUIT_PLANET_MAP[suit] ?? "moon";
  const hit = transits.find(
    (aspect) =>
      aspect.bodyA.toLowerCase().includes(linkedPlanet) ||
      aspect.bodyB.toLowerCase().includes(linkedPlanet)
  );

  if (!hit) {
    return `Gökyüzünde ${linkedPlanet} ekseni şu an sessiz ama kart sembolizmi bu gezegenin temasını taşıyor.`;
  }

  return `Anlık gökyüzü: ${hit.bodyA} ile ${hit.bodyB} arasında ${hit.typeLabel} (${hit.orb}° orb) — kartın enerjisi bununla rezonansa giriyor.`;
}

function buildNatalResonance(
  card: TarotReadingCard,
  natal: NatalChartSummary
): string {
  const suit = extractSuitFromCardId(card.id);
  const planetId = SUIT_PLANET_MAP[suit] ?? "sun";
  const natalPlanet = findNatalPlanet(natal, planetId);

  if (!natalPlanet) {
    return "Natal haritanda bu eksen farklı bir burçta konuşuyor; kart yine de duygusal bir kapı aralıyor.";
  }

  return `Natal ${natalPlanet.name}: ${natalPlanet.label} · ${natalPlanet.house}. evde — kart bu ev temasını uyandırıyor.`;
}

function buildCardSymbolism(card: TarotReadingCard): string {
  const keywords = card.keywords.length > 0 ? card.keywords.join(", ") : "gizli potansiyel";
  return `${card.name} — ${keywords} (archetypal dil)`;
}

function enrichTarotCards(
  cards: TarotReadingCard[],
  natal: NatalChartSummary,
  transits: CosmicAnalysisContext["transits"]["aspectsToNatal"]
): EmphTarotCardInsight[] {
  return cards.map((card, index) => {
    const position = (card.position ?? SPREAD_POSITIONS[index]) as (typeof SPREAD_POSITIONS)[number];

    return {
      position,
      id: card.id,
      name: card.name,
      keywords: card.keywords,
      spreadRole: SPREAD_ROLE[position],
      symbolism: buildCardSymbolism(card),
      natalResonance: buildNatalResonance(card, natal),
      skyLink: buildSkyLinkForCard(card, transits),
    };
  });
}

function detectCosmicTensions(
  context: CosmicAnalysisContext
): EmphCosmicTension[] {
  const tensions: EmphCosmicTension[] = [];

  const hardTypes = new Set(["square", "opposition"]);

  for (const aspect of context.transits.aspectsToNatal) {
    if (!hardTypes.has(aspect.type) || aspect.orb > 5) {
      continue;
    }

    tensions.push({
      id: `transit-${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`,
      technicalNote: `Transit ${aspect.bodyA} · Natal ${aspect.bodyB}: ${aspect.typeLabel} (${aspect.orb}°)`,
      intuitiveHint:
        "Gökyüzü bu konuda seni biraz yavaşlatıyor gibi hissettiriyor; acele karar yerine nefes almak iyi gelebilir.",
    });
  }

  const horaryMoon = context.horaryMoment.planets.find((planet) => planet.id === "moon");
  const natalSaturn = context.natal.planets.find((planet) => planet.id === "saturn");

  if (horaryMoon && natalSaturn) {
    const diff = Math.abs(horaryMoon.longitude - natalSaturn.longitude);
    const separation = Math.min(diff, 360 - diff);
    if (separation >= 85 && separation <= 95) {
      tensions.push({
        id: "horary-moon-natal-saturn-square",
        technicalNote: "Horary Ay ile natal Satürn arasında kareye yakın gerilim",
        intuitiveHint:
          "İç sesin bugün daha temkinli; bu bir ret değil, olgunlaşma çağrısı olabilir.",
      });
    }
  }

  return tensions.slice(0, 4);
}

function buildNarrativeSeeds(
  mode: EmphReadingMode,
  question: string,
  cards: EmphTarotCardInsight[] | undefined,
  tensions: EmphCosmicTension[]
): string[] {
  const seeds: string[] = [
    `Soru odağı: "${question}"`,
    `Emph motoru natal ev yerleşimleri ile anlık gökyüzünü kıyasladı.`,
  ];

  if (tensions.length > 0) {
    seeds.push(
      `Çelişki/gerilim sinyali: ${tensions[0].intuitiveHint}`
    );
  }

  if (mode === "tarot" && cards) {
    seeds.push(
      `Sol-Orta-Sağ hikaye akışı: ${cards.map((card) => `${card.position}=${card.name}`).join(" → ")}`
    );
  }

  return seeds;
}

async function buildEmphBase(
  userData: UserData,
  askedAt: Date = new Date()
): Promise<{
  context: CosmicAnalysisContext;
  natal: NatalChartSummary;
}> {
  const context = await buildCosmicAnalysisContext(userData, askedAt);
  return { context, natal: context.natal };
}

export async function processTarotThroughEmph(
  userData: UserData,
  question: string,
  cards: TarotReadingCard[]
): Promise<EmphEnrichedPackage> {
  const askedAt = new Date();
  const { context, natal } = await buildEmphBase(userData, askedAt);
  const enrichedCards = enrichTarotCards(
    cards,
    natal,
    context.transits.aspectsToNatal
  );
  const cosmicTensions = detectCosmicTensions(context);

  return {
    engine: "emph",
    mode: "tarot",
    askedAt: askedAt.toISOString(),
    question: question.trim(),
    profile: {
      userSummary: formatUserDataForPrompt(userData),
      partnerSummary: formatPartnerDataForPrompt(userData),
    },
    natalChart: natal,
    skyMoment: context.horaryMoment,
    transitsToNatal: context.transits.aspectsToNatal,
    synastry: context.synastry,
    cosmicTensions,
    tarotCards: enrichedCards,
    narrativeSeeds: buildNarrativeSeeds("tarot", question, enrichedCards, cosmicTensions),
  };
}

export async function processHoraryThroughEmph(
  userData: UserData,
  question: string
): Promise<EmphEnrichedPackage> {
  const askedAt = new Date();
  const { context, natal } = await buildEmphBase(userData, askedAt);
  const cosmicTensions = detectCosmicTensions(context);

  return {
    engine: "emph",
    mode: "horary",
    askedAt: askedAt.toISOString(),
    question: question.trim(),
    profile: {
      userSummary: formatUserDataForPrompt(userData),
      partnerSummary: hasPartnerData(userData)
        ? formatPartnerDataForPrompt(userData)
        : "Partner kaydı yok",
    },
    natalChart: natal,
    skyMoment: context.horaryMoment,
    transitsToNatal: context.transits.aspectsToNatal,
    synastry: context.synastry,
    cosmicTensions,
    narrativeSeeds: buildNarrativeSeeds("horary", question, undefined, cosmicTensions),
  };
}
