import "server-only";

import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { detectCosmicTensions } from "@/lib/astrology/emph-processing-engine";
import type { NatalChartSummary } from "@/lib/astrology/types";
import type { ManifestoCategoryId, ManifestoTechniqueId } from "@/lib/manifesto/types";
import { formatUserDataForPrompt } from "@/lib/tarot/tarot-profile-server";
import type { UserData } from "@/types/user";

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
  profile: {
    userSummary: string;
  };
  natalChart: NatalChartSummary;
  skyMoment: CosmicAnalysisContext["horaryMoment"];
  transitsToNatal: CosmicAnalysisContext["transits"]["aspectsToNatal"];
  cosmicTensions: ReturnType<typeof detectCosmicTensions>;
  narrativeSeeds: string[];
};

function buildManifestoNarrativeSeeds(
  packageData: Omit<ManifestoEmphPackage, "narrativeSeeds">
): string[] {
  const seeds = [
    `Niyet kategorisi: ${packageData.categoryLabel}`,
    `Teknik: ${packageData.techniqueLabel} — Gün ${packageData.cycleDay}/${packageData.maxDays}`,
    `Emph motoru natal harita ile bugünkü gökyüzünü kıyasladı.`,
  ];

  if (packageData.intention.trim()) {
    seeds.push(`Kullanıcı niyeti: "${packageData.intention.trim()}"`);
  }

  if (packageData.cosmicTensions.length > 0) {
    seeds.push(`Günün gerilimi: ${packageData.cosmicTensions[0].intuitiveHint}`);
  }

  const topTransit = packageData.transitsToNatal[0];
  if (topTransit) {
    seeds.push(
      `Transit odağı: ${topTransit.bodyA} · ${topTransit.bodyB} (${topTransit.typeLabel})`
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
  const cosmicTensions = detectCosmicTensions(context).slice(0, 3);
  const transitsToNatal = context.transits.aspectsToNatal.slice(0, 6);

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
    profile: {
      userSummary: formatUserDataForPrompt(input.userData),
    },
    natalChart: context.natal,
    skyMoment: context.horaryMoment,
    transitsToNatal,
    cosmicTensions,
  };

  return {
    ...base,
    narrativeSeeds: buildManifestoNarrativeSeeds(base),
  };
}
