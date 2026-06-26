import { describe, expect, it } from "vitest";
import { relationshipSliceToSharePayload } from "@/lib/social/adapters/relationship";
import { buildSynastryBondsSharePayload } from "@/lib/social/adapters/synastry-bonds";
import { typingEffectText } from "@/lib/social/video/typing-effect";
import { SOCIAL_CANVAS_HEIGHT, SOCIAL_CANVAS_WIDTH } from "@/lib/social/constants";

describe("social-share-engine", () => {
  it("maps relationship slice score into share payload", () => {
    const payload = relationshipSliceToSharePayload({
      module: "relationship",
      askedAt: "2026-06-08T12:00:00.000Z",
      perspective: { ascendantDegree: 210, mode: "natal-fixed" },
      natal: {
        meta: {
          birthUtc: "",
          birthPlace: "İstanbul",
          latitude: 41,
          longitude: 29,
          timezone: "Europe/Istanbul",
        },
        ascendant: {
          longitude: 210,
          signName: "Akrep",
          label: "0° Akrep",
        },
        planets: [],
        aspects: [],
        houses: [],
      },
      userName: "Ayşe",
      partnerName: "Mehmet",
      score: 82,
      scoreLabel: "Uyum Skoru",
      summary: "Güçlü Venüs-Mars uyumu",
    });

    expect(payload.templateId).toBe("relationship-synastry");
    expect(payload.score?.value).toBe(82);
    expect(payload.title).toContain("Ayşe");
    expect(payload.shareText).toContain("82");
  });

  it("uses vertical story canvas dimensions", () => {
    expect(SOCIAL_CANVAS_WIDTH).toBe(1080);
    expect(SOCIAL_CANVAS_HEIGHT).toBe(1920);
  });

  it("typing effect reveals text progressively", () => {
    expect(typingEffectText("AstroTag", 0)).toBe("");
    expect(typingEffectText("AstroTag", 0.5).length).toBeGreaterThan(0);
    expect(typingEffectText("AstroTag", 1)).toBe("AstroTag");
  });

  it("maps synastry bonds scores through relationship adapter", () => {
    const payload82 = buildSynastryBondsSharePayload({
      userName: "Ayşe",
      partnerName: "Mehmet",
      score: 82,
      summary: "Dengeli Venüs teması",
      date: "8 Haziran 2026",
      userAscendantDegree: 60,
    });

    const payload94 = buildSynastryBondsSharePayload({
      userName: "Ayşe",
      partnerName: "Mehmet",
      score: 94,
      summary: "Güçlü üçgen ağı",
      date: "8 Haziran 2026",
      userAscendantDegree: 180,
    });

    expect(payload82.score?.value).toBe(82);
    expect(payload94.score?.value).toBe(94);
    expect(payload82.shareText).toContain("82");
    expect(payload94.shareText).toContain("94");
    expect(payload82.templateId).toBe("relationship-synastry");
  });
});
