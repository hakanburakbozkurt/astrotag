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

export type ManifestoNatalLensId =
  | "category_house_depth"
  | "key_aspect_pattern"
  | "chart_ruler_axis"
  | "dominant_element_texture"
  | "category_planet_voice"
  | "angular_house_spine"
  | "moon_emotional_substrate"
  | "sun_core_identity";

export type ManifestoCosmicLensId =
  | "primary_transit"
  | "secondary_transit"
  | "tension_vector"
  | "sky_moment_mood";

export type ManifestoNarrativeDirective = {
  natalLens: {
    id: ManifestoNatalLensId;
    focusLabel: string;
    anchorFacts: string[];
    instruction: string;
  };
  cosmicLens: {
    id: ManifestoCosmicLensId;
    focusLabel: string;
    anchorFacts: string[];
    instruction: string;
  };
  variation: {
    bannedMetaphors: string[];
    suggestedImageryDomains: string[];
    sentenceStructureHint: string;
  };
  intentionBlend: {
    weaveMode: string;
    structurePattern: string;
    instruction: string;
  };
  avoidReuseFromPrevious: string[];
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
  narrativeDirective: ManifestoNarrativeDirective;
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
  tensions: ReturnType<typeof detectCosmicTensions>,
  cycleDay: number
): ManifestoTransitHighlight[] {
  const transitSeeds = [
    (t: (typeof transits)[number]) =>
      `Transit ${t.bodyA} natal ${t.bodyB} ile ${t.typeLabel} (${t.orb}°) — bugünün gökyüzü gerilimi.`,
    (t: (typeof transits)[number]) =>
      `${t.bodyA} → natal ${t.bodyB}: ${t.typeLabel} açısı (${t.orb}°) aktif.`,
    (t: (typeof transits)[number]) =>
      `Anlık ${t.bodyA}, doğum haritandaki ${t.bodyB} ile ${t.typeLabel} konuşuyor (${t.orb}°).`,
  ];

  const fromTransits = transits.slice(0, 8).map((t, index) => {
    const seedFn = transitSeeds[(cycleDay + index) % transitSeeds.length];
    return {
      label: `${t.bodyA} → natal ${t.bodyB}`,
      typeLabel: t.typeLabel,
      orb: t.orb,
      interpretationSeed: seedFn(t),
    };
  });

  if (fromTransits.length > 0) {
    return fromTransits;
  }

  return tensions.slice(0, 3).map((t, index) => ({
    label: t.technicalNote,
    typeLabel: "gerilim",
    orb: 0,
    interpretationSeed:
      index === 0
        ? t.intuitiveHint
        : `${t.intuitiveHint} — kategori niyetine göre yorumla.`,
  }));
}

const NATAL_LENS_ORDER: ManifestoNatalLensId[] = [
  "category_planet_voice",
  "key_aspect_pattern",
  "chart_ruler_axis",
  "category_house_depth",
  "angular_house_spine",
  "moon_emotional_substrate",
  "sun_core_identity",
  "dominant_element_texture",
];

const COSMIC_LENS_ORDER: ManifestoCosmicLensId[] = [
  "primary_transit",
  "tension_vector",
  "secondary_transit",
  "sky_moment_mood",
];

const IMAGERY_DOMAINS = [
  "metal ve ocak",
  "su akışı ve gelgit",
  "ağaç halkaları ve mevsim",
  "taş ve kristal yapı",
  "ateş ve demir",
  "kuş uçuşu ve rüzgâr",
  "iplik dokuma ve desen",
  "müzik ve ritim",
  "harita ve pusula",
  "kılıç ve kını",
  "bal arısı ve petek",
  "gökyüzü rengi ve alacakaranlık",
] as const;

const SENTENCE_STRUCTURES = [
  "Kısa vuruş cümlesi + uzun açıklayıcı cümle",
  "Devrik yapı ile açılış; ikinci cümle düz anlatım",
  "Tek uzun, nefesli cümle — virgüllerle katmanlı",
  "Paralel iki yüklemli cümle (A yapar, B taşır)",
  "Soru retoriği ile açılış, ardından kesin bildirim",
  "Somut imgelerle başla, astro terimi sonda çözül",
] as const;

const INTENTION_WEAVE_MODES = [
  {
    weaveMode: "fiil_yankısı",
    structurePattern: "Niyet fiilini astro özne ile aynı cümlede birleştir",
    instruction:
      "Kullanıcının niyetindeki eylem fiilini seç; harita lens'indeki gezegen/ev o fiilin öznesi veya aracı olsun.",
  },
  {
    weaveMode: "duygusal_çekirdek",
    structurePattern: "Niyetin duygusal çekirdeğini Ay/ev temasına bağla",
    instruction:
      "Niyet cümlesindeki duygu kelimesini Ay veya kategori evi ile eşleştir; duyguyu haritada somutlaştır.",
  },
  {
    weaveMode: "zıtlık_hizalanma",
    structurePattern: "Transit gerilimi → niyet çözümü",
    instruction:
      "Önce kozmik/haritalı bir gerilim kur; ikinci cümlede niyeti o gerilimin stratejik cevabı olarak konumlandır.",
  },
  {
    weaveMode: "anahtar_kelime_gömme",
    structurePattern: "Niyetten tek anahtar kelimeyi astro metaforun içine göm",
    instruction:
      "Niyetten bir isim veya sıfat seç; astro cümlesinin metaforunda o kelime doğal geçsin — tırnak kullanma.",
  },
  {
    weaveMode: "bedensel_köprü",
    structurePattern: "Beden duyusu + gezegen eylemi",
    instruction:
      "Nefes, omuz, kalp gibi bedensel bir imgelerle niyeti taşı; gezegen/ev konumunu o beden bölgesine metaforla bağla.",
  },
  {
    weaveMode: "zaman_katmanı",
    structurePattern: "Geçmiş-imge + bugünkü manifesto",
    instruction:
      "Haritadaki bir kalıbı geçmiş deneyim imgeleriyle aç; manifestoClaim bugünkü dönüşümü ilan etsin.",
  },
] as const;

const BANNED_METAPHOR_ROTATION = [
  ["tohum", "filiz", "çimlen"],
  ["kapı", "eşik", "geçit"],
  ["köprü", "yolculuk", "rota"],
  ["frekans", "dalga", "titreşim"],
  ["spiral", "evren sana", "kozmik kapı"],
] as const;

function pickLensIndex(cycleDay: number, category: ManifestoCategoryId, modulus: number): number {
  const categoryOffset = category.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (cycleDay + categoryOffset) % modulus;
}

function buildNatalLens(
  lensId: ManifestoNatalLensId,
  natal: NatalChartSummary,
  categoryFocus: ManifestoCategoryFocus,
  natalSignature: ManifestoNatalSignature
): ManifestoNarrativeDirective["natalLens"] {
  const sun = natal.planets.find((p) => p.id === "sun");
  const moon = natal.planets.find((p) => p.id === "moon");
  const categoryPlanet = categoryFocus.relevantPlanets[0];
  const categoryHouse = categoryFocus.relevantHouses[0];
  const keyAspect = natal.aspects[0];
  const angular = natal.planets.filter((p) => [1, 4, 7, 10].includes(p.house));

  switch (lensId) {
    case "category_planet_voice":
      return {
        id: lensId,
        focusLabel: "Kategori gezegeni sesi",
        anchorFacts: categoryFocus.relevantPlanets.map(
          (p) => `${p.label} · ${p.house}. ev`
        ),
        instruction:
          "Kategori gezegenlerinden birini bugünün ana anlatı sesi yap; ev konumunu niyet temasına bağla. Yükselen/Ay listeleme.",
      };
    case "key_aspect_pattern":
      return {
        id: lensId,
        focusLabel: "Açı kalıbı",
        anchorFacts: natalSignature.keyAspects.slice(0, 3),
        instruction:
          "Tek bir natal açı kalıbını derinleştir; kişinin kategori niyetindeki kalıbı nasıl taşıdığını anlat. Gezegen listesi değil, açı dinamiği.",
      };
    case "chart_ruler_axis":
      return {
        id: lensId,
        focusLabel: "Harita yöneticisi ekseni",
        anchorFacts: [natalSignature.chartRuler, natalSignature.ascendant],
        instruction:
          "Harita yöneticisini ve yükselen eksenini bugünün otorite teması yap; yönetici gezegenin niyete nasıl hükmettiğini göster.",
      };
    case "category_house_depth":
      return {
        id: lensId,
        focusLabel: "Kategori ev derinliği",
        anchorFacts: categoryFocus.relevantHouses.map(
          (h) => `${h}. ev · ${categoryFocus.theme}`
        ),
        instruction: `${categoryHouse ?? categoryFocus.relevantHouses[0]}. evi bugünün sahnesi yap; ev temasını niyet cümlesiyle harmanla.`,
      };
    case "angular_house_spine":
      return {
        id: lensId,
        focusLabel: "Açısal ev omurgası",
        anchorFacts: angular.slice(0, 3).map((p) => `${p.name}: ${p.label}`),
        instruction:
          "AC/IC/MC/DSC ekseninden bir gezegeni seç; yaşam omurgası metaforu kur. Standart trio (Güneş-Ay-Yükselen) YASAK.",
      };
    case "moon_emotional_substrate":
      return {
        id: lensId,
        focusLabel: "Ay duygusal zemin",
        anchorFacts: [moon?.label ?? natalSignature.moon],
        instruction:
          "Ay konumunu duygusal zemin olarak kullan; niyetin içsel ihtiyacını Ay burcu/evi üzerinden somutlaştır.",
      };
    case "sun_core_identity":
      return {
        id: lensId,
        focusLabel: "Güneş öz kimlik",
        anchorFacts: [sun?.label ?? natalSignature.sun],
        instruction:
          "Güneş burcu/evini öz kimlik merkezi yap; manifestoClaim ile Güneş temasını organik bağla.",
      };
    case "dominant_element_texture":
      return {
        id: lensId,
        focusLabel: "Baskın element dokusu",
        anchorFacts: [natalSignature.dominantElement, ...(keyAspect ? [`${keyAspect.planetA}-${keyAspect.planetB} ${keyAspect.typeLabel}`] : [])],
        instruction:
          "Haritanın baskın burç/element dokusunu metafor malzemesi yap; ateş/toprak/hava/su imgelerini burç gerçeklerine bağla.",
      };
    default:
      return {
        id: "category_planet_voice",
        focusLabel: "Kategori gezegeni",
        anchorFacts: categoryPlanet ? [`${categoryPlanet.label} · ${categoryPlanet.house}. ev`] : [],
        instruction: "Kategori gezegenini niyet temasıyla birleştir.",
      };
  }
}

function buildCosmicLens(
  lensId: ManifestoCosmicLensId,
  transitHighlights: ManifestoTransitHighlight[],
  cosmicTensions: ReturnType<typeof detectCosmicTensions>,
  skyMoment: CosmicAnalysisContext["horaryMoment"],
  cycleDay: number
): ManifestoNarrativeDirective["cosmicLens"] {
  const transitIndex = cycleDay % Math.max(transitHighlights.length, 1);
  const primary = transitHighlights[transitIndex];
  const secondary = transitHighlights[(transitIndex + 1) % Math.max(transitHighlights.length, 1)];
  const tension = cosmicTensions[cycleDay % Math.max(cosmicTensions.length, 1)];

  switch (lensId) {
    case "primary_transit":
      return {
        id: lensId,
        focusLabel: "Birincil transit",
        anchorFacts: primary ? [primary.label, `${primary.typeLabel} (${primary.orb}°)`, primary.interpretationSeed] : ["Anlık transit verisi seyrek — skyMoment kullan"],
        instruction:
          "Tek bir transit açısını bugünün kozmik kancası yap; kategori niyetiyle kesiştir. 'Kapı açılıyor' kalıbı YASAK.",
      };
    case "secondary_transit":
      return {
        id: lensId,
        focusLabel: "İkincil transit katmanı",
        anchorFacts: secondary ? [secondary.label, secondary.interpretationSeed] : primary ? [primary.interpretationSeed] : [],
        instruction:
          "İkincil veya destekleyici transit'i arka plan gerilimi olarak kullan; birincil gezegen tekrarından kaçın.",
      };
    case "tension_vector":
      return {
        id: lensId,
        focusLabel: "Kozmik gerilim vektörü",
        anchorFacts: tension ? [tension.intuitiveHint, tension.technicalNote] : primary ? [primary.interpretationSeed] : [],
        instruction:
          "cosmicTensions'dan bir gerilimi strateji veya fırsat vektörüne çevir; korku satma, net rehberlik ver.",
      };
    case "sky_moment_mood": {
      const horaryMoon = skyMoment.planets.find((p) => p.id === "moon");
      return {
        id: lensId,
        focusLabel: "Anlık gökyüzü atmosferi",
        anchorFacts: [
          `Anlık moment: ${skyMoment.at}`,
          horaryMoon ? `Horary Ay: ${horaryMoon.name}` : "Horary Ay verisi",
        ],
        instruction:
          "Anlık gökyüzü momentini (horary Ay, zaman damgası) kategori niyetinin duygusal havasıyla eşle; transit yoksa bu lens yeterli.",
      };
    }
    default:
      return {
        id: "primary_transit",
        focusLabel: "Transit",
        anchorFacts: primary ? [primary.label] : [],
        instruction: "Tek transit seç ve niyetle bağla.",
      };
  }
}

function extractAvoidReuseSnippets(
  previousPresentation: string | null | undefined
): string[] {
  if (!previousPresentation?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(previousPresentation) as {
      cosmicHook?: string;
      natalMirror?: string;
      manifestoClaim?: string;
    };
    const snippets: string[] = [];
    for (const layer of [parsed.cosmicHook, parsed.natalMirror, parsed.manifestoClaim]) {
      if (layer?.trim()) {
        snippets.push(layer.trim().slice(0, 120));
      }
    }
    return snippets.slice(0, 3);
  } catch {
    return [previousPresentation.trim().slice(0, 160)];
  }
}

function buildNarrativeDirective(input: {
  cycleDay: number;
  category: ManifestoCategoryId;
  categoryLabel: string;
  intention: string;
  natal: NatalChartSummary;
  categoryFocus: ManifestoCategoryFocus;
  natalSignature: ManifestoNatalSignature;
  transitHighlights: ManifestoTransitHighlight[];
  cosmicTensions: ReturnType<typeof detectCosmicTensions>;
  skyMoment: CosmicAnalysisContext["horaryMoment"];
  previousPresentation?: string | null;
}): ManifestoNarrativeDirective {
  const natalLensId =
    NATAL_LENS_ORDER[pickLensIndex(input.cycleDay, input.category, NATAL_LENS_ORDER.length)];
  const cosmicLensId =
    COSMIC_LENS_ORDER[pickLensIndex(input.cycleDay + 1, input.category, COSMIC_LENS_ORDER.length)];

  const weave =
    INTENTION_WEAVE_MODES[
      pickLensIndex(input.cycleDay, input.category, INTENTION_WEAVE_MODES.length)
    ];
  const imagery =
    IMAGERY_DOMAINS[pickLensIndex(input.cycleDay + 2, input.category, IMAGERY_DOMAINS.length)];
  const structure =
    SENTENCE_STRUCTURES[pickLensIndex(input.cycleDay + 3, input.category, SENTENCE_STRUCTURES.length)];
  const bannedSet =
    BANNED_METAPHOR_ROTATION[
      (input.cycleDay - 1) % BANNED_METAPHOR_ROTATION.length
    ];

  return {
    natalLens: buildNatalLens(
      natalLensId,
      input.natal,
      input.categoryFocus,
      input.natalSignature
    ),
    cosmicLens: buildCosmicLens(
      cosmicLensId,
      input.transitHighlights,
      input.cosmicTensions,
      input.skyMoment,
      input.cycleDay
    ),
    variation: {
      bannedMetaphors: [...bannedSet, "ezber trio", "yükselen ay güneş sıralaması"],
      suggestedImageryDomains: [imagery, `${input.categoryLabel} teması`, "somut duyu imgeleri"],
      sentenceStructureHint: structure,
    },
    intentionBlend: {
      weaveMode: weave.weaveMode,
      structurePattern: weave.structurePattern,
      instruction: input.intention.trim()
        ? weave.instruction
        : "Niyet metni yok — kategori temasından güçlü bir varsayılan niyet tonu üret.",
    },
    avoidReuseFromPrevious: extractAvoidReuseSnippets(input.previousPresentation),
  };
}

function buildManifestoNarrativeSeeds(
  packageData: Omit<ManifestoEmphPackage, "narrativeSeeds">
): string[] {
  const seeds = [
    `${packageData.categoryLabel} · ${packageData.cyclePhase.phaseLabel}`,
    `${packageData.techniqueLabel}: ${packageData.techniquePhaseLabel}`,
    `Natal lens: ${packageData.narrativeDirective.natalLens.focusLabel}`,
    `Kozmik lens: ${packageData.narrativeDirective.cosmicLens.focusLabel}`,
    `Kategori odağı: ${packageData.categoryFocus.theme}`,
  ];

  for (const fact of packageData.narrativeDirective.natalLens.anchorFacts.slice(0, 2)) {
    seeds.push(`Harita odağı: ${fact}`);
  }

  for (const fact of packageData.narrativeDirective.cosmicLens.anchorFacts.slice(0, 2)) {
    seeds.push(`Gökyüzü odağı: ${fact}`);
  }

  if (packageData.intention.trim()) {
    seeds.push(`Niyet harmanı (${packageData.narrativeDirective.intentionBlend.weaveMode}): "${packageData.intention.trim()}"`);
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
  previousPresentation?: string | null;
}): Promise<ManifestoEmphPackage> {
  const askedAt = new Date();
  const context = await buildCosmicAnalysisContext(input.userData, askedAt);
  const cosmicTensions = detectCosmicTensions(context).slice(0, 4);
  const transitsToNatal = context.transits.aspectsToNatal.slice(0, 10);
  const natalSignature = buildNatalSignature(context.natal);
  const categoryFocus = buildCategoryFocus(context.natal, input.category);
  const transitHighlights = buildTransitHighlights(
    transitsToNatal,
    cosmicTensions,
    input.cycleDay
  );
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

  const narrativeDirective = buildNarrativeDirective({
    cycleDay: input.cycleDay,
    category: input.category,
    categoryLabel: input.categoryLabel,
    intention: input.intention,
    natal: context.natal,
    categoryFocus,
    natalSignature,
    transitHighlights,
    cosmicTensions,
    skyMoment: context.horaryMoment,
    previousPresentation: input.previousPresentation,
  });

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
    narrativeDirective,
  };

  return {
    ...base,
    narrativeSeeds: buildManifestoNarrativeSeeds(base),
  };
}
