import { describe, expect, it } from "vitest";
import {
  analyzeHarshCrossAspects,
  buildTransitStressCopy,
  resolveStressLevel,
} from "@/lib/nexus/nexus-transit-stress.logic";

describe("analyzeHarshCrossAspects", () => {
  it("counts square and opposition within orb", () => {
    const result = analyzeHarshCrossAspects([
      { bodyA: "transit:mars", bodyB: "natal:sun", type: "square", orb: 3 },
      { bodyA: "transit:venus", bodyB: "natal:moon", type: "trine", orb: 2 },
    ]);

    expect(result.count).toBe(1);
    expect(result.moonOnly).toBe(false);
  });

  it("marks moon-only harsh aspects", () => {
    const result = analyzeHarshCrossAspects([
      { bodyA: "transit:moon", bodyB: "natal:sun", type: "square", orb: 2 },
      { bodyA: "transit:moon", bodyB: "natal:venus", type: "opposition", orb: 1 },
    ]);

    expect(result.count).toBe(2);
    expect(result.moonOnly).toBe(true);
  });
});

describe("resolveStressLevel", () => {
  it("caps moon-only harsh counts at moderate", () => {
    expect(
      resolveStressLevel({ count: 4, moonOnly: true }, { count: 5, moonOnly: true })
    ).toBe("moderate");
  });

  it("allows high when non-moon harsh aspects exist", () => {
    expect(
      resolveStressLevel({ count: 3, moonOnly: false }, { count: 1, moonOnly: true })
    ).toBe("high");
  });

  it("returns moderate without triggering isStressed high path", () => {
    expect(
      resolveStressLevel({ count: 1, moonOnly: true }, { count: 1, moonOnly: true })
    ).toBe("moderate");
  });
});

describe("buildTransitStressCopy", () => {
  it("does not mark moderate as stressed", () => {
    const copy = buildTransitStressCopy({
      stressLevel: "moderate",
      harshNow: 2,
      peakTimeLabel: "14:30",
      moonSign: "Yengeç",
    });

    expect(copy.isStressed).toBe(false);
    expect(copy.tactic).toBe("Gökyüzü biraz hareketli, bugünü daha esnek planla");
  });

  it("marks high as stressed", () => {
    const copy = buildTransitStressCopy({
      stressLevel: "high",
      harshNow: 3,
      peakTimeLabel: "14:30",
      moonSign: "Yengeç",
    });

    expect(copy.isStressed).toBe(true);
    expect(copy.tactic).toContain("Stres Uyarısı");
  });
});
