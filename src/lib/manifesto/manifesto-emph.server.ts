import "server-only";

import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { detectCosmicTensions } from "@/lib/astrology/emph-processing-engine";
import type { NatalChartSummary } from "@/lib/astrology/types";
import { MANIFESTO_CATEGORY_FOCUS } from "@/lib/manifesto/manifesto-presentation";
import {
  resolveTechniqueCyclePhaseLabel,
  resolveTechniqueRitualContext,
  type ManifestoRitualContext,
} from "@/lib/manifesto/manifesto-techniques";
import type { ManifestoCategoryId, ManifestoTechniqueId } from "@/lib/manifesto/types";
import { formatUserDataForPrompt } from "@/lib/tarot/tarot-profile-server";
import type { UserData } from "@/types/user";

export type ManifestoNatalSignature = {
  ascendant: string;
  sun: string;
  moon: string;
  chartRuler: string;
  dominantElement: string;
  keyAspects: string[];
  houseHighlights: string[];
};

export type ManifestoCategoryFocus = {
  theme: string;
  relevantPlanets: Array<{ id: string; label: string; house: number }>;
  relevantHouses: number[];
};

export type ManifestoTransitHighlight = {
  label: string;
  typeLabel: string;
  orb: number;
  interpretationSeed: string;
};

export type ManifestoCyclePhase = {
  day: number;
  maxDays: number;
  phase: "seed" | "deepening" | "integration" | "harvest" | "renewal";
  phaseLabel: string;
};

export type ManifestoEmphPackage = {
  engine: "emph";
  mode: "manifesto";
  askedAt: string;
  category: ManifestoCategoryId;
  categoryLabel: string;
  techniqueType: ManifestoTechniqueId;
  techniqueLabel: string;
  intention: string;
  cycleDay: number;
  maxDays: number;
  cyclePhase: ManifestoCyclePhase;
  techniqueRitual: ManifestoRitualContext;
  techniquePhaseLabel: string;
  profile: {
    userSummary: string;
  };
  natalSignature: ManifestoNatalSignature;
  categoryFocus: ManifestoCategoryFocus;
  natalChart: NatalChartSummary;
  skyMoment: CosmicAnalysisContext["horaryMoment"];
  transitsToNatal: CosmicAnalysisContext["transits"]["aspectsToNatal"];
  transitHighlights: ManifestoTransitHighlight[];
  cosmicTensions: ReturnType<typeof detectCosmicTensions>;
  narrativeSeeds: string[];
};

function resolveCyclePhase(
  day: number,
  maxDays: number,
  techniqueType: ManifestoTechniqueId
): ManifestoCyclePhase {
  const ratio = day / maxDays;

  if (techniqueType === "369_method") {
    const phaseIndex = Math.ceil(day / 3);
    const reps = phaseIndex === 1 ? 3 : phaseIndex === 2 ? 6 : 9;
    const phaseLabel =
      phaseIndex === 1
        ? `3×3 Tohum — günde ${reps} tekrar`
        : phaseIndex === 2
          ? `3×6 Amplifikasyon — günde ${reps} tekrar`
          : `3×9 Manifest — günde ${reps} tekrar`;

    const phase: ManifestoCyclePhase["phase"] =
      phaseIndex === 1 ? "seed" : phaseIndex === 2 ? "deepening" : "integration";

    return { day, maxDays, phase, phaseLabel };
  }

  if (techniqueType === "3x33") {
    if (day === 1) {
      return {
        day,
        maxDays,
        phase: "seed",
        phaseLabel: "Tesla Girişi — sabah 3, öğle 6, akşam 9",
      };
    }
    if (day >= maxDays) {
      return { day, maxDays, phase: "harvest", phaseLabel: "33. gün — frekans kilitlendi" };
    }
    if (day <= 11) {
      return { day, maxDays, phase: "seed", phaseLabel: "Faz I — 3-6-9 ritmine giriş" };
    }
    if (day <= 22) {
      return { day, maxDays, phase: "deepening", phaseLabel: "Faz II — yoğun odak derinleşiyor" };
    }
    return { day, maxDays, phase: "integration", phaseLabel: "Faz III — sayısal imza oturuyor" };
  }

  if (day === 1) {
    return { day, maxDays, phase: "seed", phaseLabel: "Tohum — niyet ateşleniyor" };
  }

  if (day >= maxDays) {
    return { day, maxDays, phase: "harvest", phaseLabel: "Hasat — döngü zirvesi" };
  }

  if (ratio <= 0.35) {
    return { day, maxDays, phase: "seed", phaseLabel: "Tohum — kök salma" };
  }

  if (ratio <= 0.7) {
    return { day, maxDays, phase: "deepening", phaseLabel: "Derinleşme — enerji yoğunlaşıyor" };
  }

  if (ratio < 1) {
    return { day, maxDays, phase: "integration", phaseLabel: "Entegrasyon — bedende oturma" };
  }

  return { day, maxDays, phase: "renewal", phaseLabel: "Yenilenme — yeni spiral" };
}

function buildNatalSignature(natal: NatalChartSummary): ManifestoNatalSignature {
  const sun = natal.planets.find((p) => p.id === "sun");
  const moon = natal.planets.find((p) => p.id === "moon");
  const asc = natal.ascendant;

  const signCounts: Record<string, number> = {};
  for (const planet of natal.planets) {
    signCounts[planet.sign] = (signCounts[planet.sign] ?? 0) + 1;
  }
  const dominantElement = Object.entries(signCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? asc.signName;

  const chartRulerPlanet = natal.planets.find(
    (p) => p.sign === asc.signName && ["mars", "venus", "mercury", "jupiter", "saturn"].includes(p.id)
  );

  return {
    ascendant: `${asc.signName} ${Math.floor(asc.degreeInSign)}° · Yükselen`,
    sun: sun?.label ?? "Güneş bilgisi yok",
    moon: moon?.label ?? "Ay bilgisi yok",
    chartRuler: chartRulerPlanet
      ? `${chartRulerPlanet.name} (${chartRulerPlanet.label})`
      : `${asc.signName} yönetici ekseni`,
    dominantElement: `Baskın burç frekansı: ${dominantElement}`,
    keyAspects: natal.aspects.slice(0, 5).map(
      (a) => `${a.planetA}-${a.planetB} ${a.typeLabel} (${a.orb}°)`
    ),
    houseHighlights: natal.planets
      .filter((p) => [1, 4, 7, 10].includes(p.house))
      .slice(0, 4)
      .map((p) => `${p.name}: ${p.label}`),
  };
}

function buildCategoryFocus(
  natal: NatalChartSummary,
  category: ManifestoCategoryId
): ManifestoCategoryFocus {
  const focus = MANIFESTO_CATEGORY_FOCUS[category];

  const relevantPlanets = natal.planets
    .filter((p) => focus.planets.includes(p.id))
    .map((p) => ({ id: p.id, label: p.label, house: p.house }));

  return {
    theme: focus.theme,
    relevantPlanets,
    relevantHouses: focus.houses,
  };
}

function buildTransitHighlights(
  transits: CosmicAnalysisContext["transits"]["aspectsToNatal"],
  tensions: ReturnType<typeof detectCosmicTensions>
): ManifestoTransitHighlight[] {
  const fromTransits = transits.slice(0, 5).map((t) => ({
    label: `${t.bodyA} → natal ${t.bodyB}`,
    typeLabel: t.typeLabel,
    orb: t.orb,
    interpretationSeed: `Gökyüzü ${t.bodyA} ile natal ${t.bodyB} arasında ${t.typeLabel} (${t.orb}°) — bugünün kapısı.`,
  }));

  if (fromTransits.length > 0) {
    return fromTransits;
  }

  return tensions.slice(0, 3).map((t) => ({
    label: t.technicalNote,
    typeLabel: "gerilim",
    orb: 0,
    interpretationSeed: t.intuitiveHint,
  }));
}

function buildManifestoNarrativeSeeds(
  packageData: Omit<ManifestoEmphPackage, "narrativeSeeds">
): string[] {
  const seeds = [
    `${packageData.categoryLabel} · ${packageData.cyclePhase.phaseLabel}`,
    `${packageData.techniqueLabel}: ${packageData.techniquePhaseLabel}`,
    `Yükselen ${packageData.natalSignature.ascendant} · Ay ${packageData.natalSignature.moon}`,
    `Kategori odağı: ${packageData.categoryFocus.theme}`,
  ];

  if (packageData.intention.trim()) {
    seeds.push(`Niyet: "${packageData.intention.trim()}"`);
  }

  for (const tension of packageData.cosmicTensions.slice(0, 2)) {
    seeds.push(`Gerilim: ${tension.intuitiveHint}`);
  }

  for (const transit of packageData.transitHighlights.slice(0, 2)) {
    seeds.push(`Transit: ${transit.label} (${transit.typeLabel})`);
  }

  const categoryPlanet = packageData.categoryFocus.relevantPlanets[0];
  if (categoryPlanet) {
    seeds.push(
      `Kategori gezegeni: ${categoryPlanet.label} · ${categoryPlanet.house}. ev`
    );
  }

  return seeds;
}

export async function buildManifestoEmphPackage(input: {
  userData: UserData;
  category: ManifestoCategoryId;
  categoryLabel: string;
  techniqueType: ManifestoTechniqueId;
  techniqueLabel: string;
  intention: string;
  cycleDay: number;
  maxDays: number;
}): Promise<ManifestoEmphPackage> {
  const askedAt = new Date();
  const context = await buildCosmicAnalysisContext(input.userData, askedAt);
  const cosmicTensions = detectCosmicTensions(context).slice(0, 4);
  const transitsToNatal = context.transits.aspectsToNatal.slice(0, 10);
  const transitHighlights = buildTransitHighlights(
    transitsToNatal,
    cosmicTensions
  );
  const natalSignature = buildNatalSignature(context.natal);
  const categoryFocus = buildCategoryFocus(context.natal, input.category);
  const cyclePhase = resolveCyclePhase(
    input.cycleDay,
    input.maxDays,
    input.techniqueType
  );
  const techniqueRitual = resolveTechniqueRitualContext(
    input.techniqueType,
    input.cycleDay,
    input.maxDays
  );
  const techniquePhaseLabel = resolveTechniqueCyclePhaseLabel(
    input.techniqueType,
    input.cycleDay,
    input.maxDays
  );

  const base: Omit<ManifestoEmphPackage, "narrativeSeeds"> = {
    engine: "emph",
    mode: "manifesto",
    askedAt: askedAt.toISOString(),
    category: input.category,
    categoryLabel: input.categoryLabel,
    techniqueType: input.techniqueType,
    techniqueLabel: input.techniqueLabel,
    intention: input.intention.trim(),
    cycleDay: input.cycleDay,
    maxDays: input.maxDays,
    cyclePhase,
    techniqueRitual,
    techniquePhaseLabel,
    profile: {
      userSummary: formatUserDataForPrompt(input.userData),
    },
    natalSignature,
    categoryFocus,
    natalChart: context.natal,
    skyMoment: context.horaryMoment,
    transitsToNatal,
    transitHighlights,
    cosmicTensions,
  };

  return {
    ...base,
    narrativeSeeds: buildManifestoNarrativeSeeds(base),
  };
}
