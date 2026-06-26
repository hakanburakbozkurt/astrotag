import { describe, expect, it } from "vitest";
import {
  SYNASTRY_FOCUS_ASCENDANT,
  SYNASTRY_LEFT_WHEEL,
  SYNASTRY_RIGHT_WHEEL,
  synastryLocalPlanetPoint,
} from "@/lib/synastry/synastry-chart-geometry";

describe("synastry-chart-geometry", () => {
  it("uses synastry-focus mode with identical wheel params", () => {
    expect(SYNASTRY_LEFT_WHEEL.ascendant).toBe(SYNASTRY_FOCUS_ASCENDANT);
    expect(SYNASTRY_RIGHT_WHEEL.ascendant).toBe(SYNASTRY_FOCUS_ASCENDANT);
    expect(SYNASTRY_LEFT_WHEEL.radius).toBe(SYNASTRY_RIGHT_WHEEL.radius);
  });

  it("maps identical longitudes to mirrored local points on both wheels", () => {
    const longitude = 120;
    const left = synastryLocalPlanetPoint(longitude, SYNASTRY_LEFT_WHEEL);
    const right = synastryLocalPlanetPoint(longitude, SYNASTRY_RIGHT_WHEEL);

    expect(left.x).toBeCloseTo(right.x, 5);
    expect(left.y).toBeCloseTo(right.y, 5);
  });
});
