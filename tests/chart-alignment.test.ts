import { describe, expect, it } from "vitest";
import {
  CHART_ASC_SCREEN_DEGREES,
  auditZodiacWheelDirection,
  engineDegreeToChartAngle,
  engineDegreeToWheelLocalAngle,
  wheelLocalAngleToScreenAngle,
  wheelRotationCssDegrees,
} from "@/lib/astrology/chart-alignment";
import { getSignAscendantDegree } from "@/lib/cosmic-radar/sign-ascendant";

function expectAscLockedAt270(sign: Parameters<typeof getSignAscendantDegree>[0]) {
  const ascendantDegree = getSignAscendantDegree(sign);
  const ascLocal = engineDegreeToWheelLocalAngle(ascendantDegree);
  const ascScreen = wheelLocalAngleToScreenAngle(ascLocal, ascendantDegree);
  const chartAngle = engineDegreeToChartAngle(ascendantDegree, ascendantDegree);

  expect(ascScreen).toBe(CHART_ASC_SCREEN_DEGREES);
  expect(chartAngle).toBe(CHART_ASC_SCREEN_DEGREES);
}

describe("chart-alignment", () => {
  it("places ascendant degree at 270° screen position (Akrep)", () => {
    expect(getSignAscendantDegree("Akrep")).toBe(210);
    expectAscLockedAt270("Akrep");
  });

  it("locks İkizler rising cusp to ASC line (270°)", () => {
    expect(getSignAscendantDegree("İkizler")).toBe(60);
    expectAscLockedAt270("İkizler");
  });

  it("locks Terazi rising cusp to ASC line (270°)", () => {
    expect(getSignAscendantDegree("Terazi")).toBe(180);
    expectAscLockedAt270("Terazi");
  });

  it("uses wheelRotationCssDegrees = -ascendantDegree (CCW layout)", () => {
    const ascendantDegree = getSignAscendantDegree("Akrep");
    expect(wheelRotationCssDegrees(ascendantDegree)).toBe(150);
  });

  it("orders zodiac signs counter-clockwise from ASC", () => {
    expect(auditZodiacWheelDirection()).toBe("counter-clockwise");
    expect(engineDegreeToWheelLocalAngle(0)).toBe(270);
    expect(engineDegreeToWheelLocalAngle(30)).toBe(300);
    expect(engineDegreeToWheelLocalAngle(60)).toBe(330);
  });

  it("places exact zodiac degree without sign-center rounding", () => {
    const asc = getSignAscendantDegree("Koç");
    const planetAt15Aries = 15;
    const angle = engineDegreeToChartAngle(planetAt15Aries, asc);
    expect(angle).toBe(285);
  });

  it("matches wheel-child frame to screen frame after rotate", () => {
    const asc = getSignAscendantDegree("Terazi");
    const planetDegree = 195.5;
    const local = engineDegreeToWheelLocalAngle(planetDegree);
    const screen = wheelLocalAngleToScreenAngle(local, asc);
    const direct = engineDegreeToChartAngle(planetDegree, asc);
    expect(screen).toBe(direct);
  });
});
