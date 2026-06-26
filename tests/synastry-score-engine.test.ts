import { describe, expect, it } from "vitest";
import { calculateSynastryScore } from "@/lib/synastry/synastry-score-engine";
import type { SynastryCalculationResult } from "@/lib/synastry/synastry-calculation";

function mockSynastryData(
  aspectLines: SynastryCalculationResult["aspectLines"],
  overrides?: Partial<Pick<SynastryCalculationResult, "userAscendant" | "partnerAscendant" | "userPlanets" | "partnerPlanets">>
): SynastryCalculationResult {
  return {
    aspectLines,
    userPlanets: overrides?.userPlanets ?? [
      { id: "jupiter", name: "Jüpiter", symbol: "♃", longitude: 200 },
    ],
    partnerPlanets: overrides?.partnerPlanets ?? [
      { id: "saturn", name: "Satürn", symbol: "♄", longitude: 320 },
    ],
    userAscendant: overrides?.userAscendant ?? 45,
    partnerAscendant: overrides?.partnerAscendant ?? 210,
    userName: "Ali",
    partnerName: "Ayşe",
    insightLines: [],
  };
}

describe("synastry-score-engine", () => {
  it("adds points for trine aspects and subtracts for squares", () => {
    const harmonious = calculateSynastryScore(
      mockSynastryData([
        {
          id: "mercury-mercury-trine",
          userPlanetId: "mercury",
          partnerPlanetId: "mercury",
          userBody: "Merkür",
          partnerBody: "Merkür",
          type: "trine",
          typeLabel: "Üçgen",
          angle: 120,
          orb: 1.5,
          separation: 118.5,
          orbStrength: "strong",
          orbStrengthLabel: "Güçlü Uyum",
          astroNote: "Akıcı",
          samePlanetPair: true,
          aspectTitle: "Zihinsel Rezonans (Üçgen)",
          planetEffect: "İletişim akıcı",
          aspectDetail: "Detay",
          orbTechnical: "1.5° orb",
          isExactAspect: false,
        },
      ])
    );

    const tense = calculateSynastryScore(
      mockSynastryData([
        {
          id: "mars-mars-square",
          userPlanetId: "mars",
          partnerPlanetId: "mars",
          userBody: "Mars",
          partnerBody: "Mars",
          type: "square",
          typeLabel: "Kare",
          angle: 90,
          orb: 2,
          separation: 92,
          orbStrength: "supportive",
          orbStrengthLabel: "Destekleyici Etki",
          astroNote: "Gerilim",
          samePlanetPair: true,
          aspectTitle: "Eylem Gerilimi (Kare)",
          planetEffect: "Tartışma riski",
          aspectDetail: "Detay",
          orbTechnical: "2° orb",
          isExactAspect: false,
        },
      ])
    );

    expect(harmonious.score).toBeGreaterThan(50);
    expect(tense.score).toBeLessThan(50);
  });

  it("does not inflate to 100 when many aspects are detected", () => {
    const manyAspects = calculateSynastryScore(
      mockSynastryData(
        Array.from({ length: 20 }, (_, index) => ({
          id: `t-${index}`,
          userPlanetId: "venus" as const,
          partnerPlanetId: "moon" as const,
          userBody: "Venüs",
          partnerBody: "Ay",
          type: "trine" as const,
          typeLabel: "Üçgen",
          angle: 120,
          orb: 1 + index * 0.2,
          separation: 119,
          orbStrength: "strong" as const,
          orbStrengthLabel: "Güçlü Uyum",
          astroNote: "Akıcı",
          samePlanetPair: false,
          aspectTitle: "Duygusal Rezonans (Üçgen)",
          planetEffect: "Uyum",
          aspectDetail: "Detay",
          orbTechnical: "1° orb",
          isExactAspect: true,
        }))
      )
    );

    expect(manyAspects.score).toBeLessThan(100);
    expect(manyAspects.score).toBeGreaterThan(50);
  });

  it("changes score when partner birth data changes aspect set", () => {
    const chartA = calculateSynastryScore(
      mockSynastryData([
        {
          id: "a-trine",
          userPlanetId: "venus",
          partnerPlanetId: "moon",
          userBody: "Venüs",
          partnerBody: "Ay",
          type: "trine",
          typeLabel: "Üçgen",
          angle: 120,
          orb: 1,
          separation: 119,
          orbStrength: "strong",
          orbStrengthLabel: "Güçlü Uyum",
          astroNote: "Akıcı",
          samePlanetPair: false,
          aspectTitle: "Duygusal Rezonans (Üçgen)",
          planetEffect: "Uyum",
          aspectDetail: "Detay",
          orbTechnical: "1° orb",
          isExactAspect: true,
        },
      ])
    );

    const chartB = calculateSynastryScore(
      mockSynastryData([
        {
          id: "b-square",
          userPlanetId: "mars",
          partnerPlanetId: "mars",
          userBody: "Mars",
          partnerBody: "Mars",
          type: "square",
          typeLabel: "Kare",
          angle: 90,
          orb: 1.5,
          separation: 91.5,
          orbStrength: "strong",
          orbStrengthLabel: "Güçlü Uyum",
          astroNote: "Gerilim",
          samePlanetPair: true,
          aspectTitle: "Eylem Gerilimi (Kare)",
          planetEffect: "Tartışma riski",
          aspectDetail: "Detay",
          orbTechnical: "1.5° orb",
          isExactAspect: false,
        },
      ])
    );

    expect(chartA.score).not.toBe(chartB.score);
    expect(chartA.score).toBeGreaterThan(chartB.score);
  });

  it("returns algorithm summary without AI", () => {
    const result = calculateSynastryScore(mockSynastryData([]));

    expect(result.algorithmSummary).toContain("Ali");
    expect(result.algorithmSummary).toContain("Ayşe");
    expect(result.baseScore).toBe(50);
  });
});
