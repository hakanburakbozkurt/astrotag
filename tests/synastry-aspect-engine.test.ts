import { describe, expect, it } from "vitest";
import {
  buildAspectDrivenTitle,
  buildOrbTechnicalLine,
  buildPlanetPairEffect,
  buildSynastryMatchPresentation,
} from "@/lib/synastry/synastry-match-logic";
import {
  classifyOrbStrength,
  detectSynastryCrossAspect,
  isValidTrineSeparation,
} from "@/lib/synastry/synastry-aspect-engine";

describe("synastry-aspect-engine", () => {
  it("classifies orb strength tiers", () => {
    expect(classifyOrbStrength(1.2).label).toBe("Güçlü Uyum");
    expect(classifyOrbStrength(3).label).toBe("Destekleyici Etki");
    expect(classifyOrbStrength(5.5).label).toBe("Zayıf/Düşük Etki");
  });

  it("rejects conjunction as trine", () => {
    expect(isValidTrineSeparation(2, 8)).toBe(false);
    expect(isValidTrineSeparation(120, 2)).toBe(true);
  });

  it("detects mercury trine with aspect-driven title", () => {
    const match = detectSynastryCrossAspect({
      userLongitude: 15,
      partnerLongitude: 135,
      userPlanetId: "mercury",
      partnerPlanetId: "mercury",
    });

    expect(match?.type).toBe("trine");
    expect(match?.aspectTitle).toBe("Zihinsel Rezonans (Üçgen)");
    expect(match?.planetEffect).toContain("iletişim");
  });

  it("detects square with aspect-driven title", () => {
    const match = detectSynastryCrossAspect({
      userLongitude: 10,
      partnerLongitude: 100,
      userPlanetId: "mars",
      partnerPlanetId: "venus",
    });

    expect(match?.type).toBe("square");
    expect(match?.aspectTitle).toBe("Arzu–Gerilim (Kare)");
  });
});

describe("synastry-match-logic", () => {
  it("builds mercury conjunction title", () => {
    expect(
      buildAspectDrivenTitle({
        userPlanetId: "mercury",
        partnerPlanetId: "mercury",
        type: "conjunction",
        typeLabel: "Kavuşum",
      })
    ).toBe("Zihinsel Bütünleşme (Kavuşum)");
  });

  it("builds jupiter-venus pair effect", () => {
    const effect = buildPlanetPairEffect({
      userPlanetId: "jupiter",
      partnerPlanetId: "venus",
      type: "trine",
      tier: "strong",
    });

    expect(effect).toContain("Keyifli");
  });

  it("marks exact aspect in orb technical line", () => {
    const line = buildOrbTechnicalLine({
      orb: 0.38,
      orbStrengthLabel: "Güçlü Uyum",
    });

    expect(line).toBe("Orb 0.38° · Güçlü Uyum · Tam Açı (Exact Aspect)");
  });

  it("builds full presentation layers", () => {
    const presentation = buildSynastryMatchPresentation({
      userPlanetId: "jupiter",
      partnerPlanetId: "mars",
      userBody: "Jüpiter",
      partnerBody: "Mars",
      type: "square",
      typeLabel: "Kare",
      angle: 90,
      orb: 2.5,
      orbStrengthLabel: "Destekleyici Etki",
      tier: "supportive",
    });

    expect(presentation.aspectTitle).toBe("Rekabetçi Güdü (Kare)");
    expect(presentation.orbTechnical).toContain("Orb 2.50°");
    expect(presentation.isExactAspect).toBe(false);
  });
});
