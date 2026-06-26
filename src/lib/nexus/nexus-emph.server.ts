import "server-only";

import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import type { NatalChartSummary } from "@/lib/astrology/types";
import { detectCosmicTensions } from "@/lib/astrology/emph-processing-engine";
import { resolveProfileSunSigns } from "@/lib/astrology/sun-sign";
import { computeNexusTransitStress } from "@/lib/nexus/nexus-transit-stress.server";
import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";
import type { UserData } from "@/types/user";

export type NexusEmphPackage = {
  engine: "emph";
  mode: "nexus";
  askedAt: string;
  dateKey: string;
  profile: {
    userName: string;
    partnerName: string | null;
    userSunSign: string;
    partnerSunSign: string | null;
  };
  natalChart: NatalChartSummary;
  transitsToNatal: CosmicAnalysisContext["transits"]["aspectsToNatal"];
  transitPlanets: CosmicAnalysisContext["transits"]["planets"];
  cosmicTensions: ReturnType<typeof detectCosmicTensions>;
  transitStress: NexusTransitStress;
  narrativeSeeds: string[];
};

function buildNexusNarrativeSeeds(
  packageData: Omit<NexusEmphPackage, "narrativeSeeds">
): string[] {
  const seeds = [
    `Gün: ${packageData.dateKey}`,
    `Gökyüzü baskısı: ${packageData.transitStress.stressLevel} · ${packageData.transitStress.skySummary}`,
    `Taktik: ${packageData.transitStress.tactic}`,
  ];

  if (packageData.cosmicTensions.length > 0) {
    seeds.push(`Gerilim: ${packageData.cosmicTensions[0].technicalNote}`);
  }

  const topTransit = packageData.transitsToNatal[0];
  if (topTransit) {
    seeds.push(
      `Öncelikli transit: ${topTransit.bodyA} · ${topTransit.bodyB} (${topTransit.typeLabel}, ${topTransit.orb}°)`
    );
  }

  return seeds;
}

export async function buildNexusEmphPackage(
  userData: UserData,
  dateKey: string
): Promise<NexusEmphPackage> {
  const askedAt = new Date();
  const [context, transitStress] = await Promise.all([
    buildCosmicAnalysisContext(userData, askedAt),
    computeNexusTransitStress(userData),
  ]);

  const signs = resolveProfileSunSigns(userData);
  const cosmicTensions = detectCosmicTensions(context);

  const base: Omit<NexusEmphPackage, "narrativeSeeds"> = {
    engine: "emph",
    mode: "nexus",
    askedAt: askedAt.toISOString(),
    dateKey,
    profile: {
      userName: userData.name,
      partnerName: userData.partnerName?.trim() ?? null,
      userSunSign: signs.userSign ?? "—",
      partnerSunSign: signs.partnerSign,
    },
    natalChart: context.natal,
    transitsToNatal: context.transits.aspectsToNatal,
    transitPlanets: context.transits.planets,
    cosmicTensions,
    transitStress,
  };

  return {
    ...base,
    narrativeSeeds: buildNexusNarrativeSeeds(base),
  };
}
