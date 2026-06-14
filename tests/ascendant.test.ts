import { describe, expect, it } from "vitest";
import { calculateAscendant } from "@/lib/astrology/ascendant";

/**
 * RadixPro referans: Enschede (NL), 2016-11-02 21:17:30 UT
 * lat 52°13'N, lon 6°54'E — tropikal ASC ≈ 123.508° (3°30' Aslan)
 *
 * Eski hatalı formül ~303.5° (karşı kuadran) üretiyordu; düzeltilmiş değer budur.
 */
const ENSCHEDE_REFERENCE = {
  date: new Date("2016-11-02T21:17:30.000Z"),
  latitude: 52 + 13 / 60,
  longitude: 6 + 54 / 60,
  expectedAscLongitude: 123.50830687096277,
  expectedSignName: "Aslan",
  toleranceDeg: 0.05,
} as const;

describe("calculateAscendant", () => {
  it("Enschede referans haritasında ASC kuadranını doğru hesaplar", () => {
    const ascendant = calculateAscendant(
      ENSCHEDE_REFERENCE.date,
      ENSCHEDE_REFERENCE.latitude,
      ENSCHEDE_REFERENCE.longitude
    );

    expect(
      Math.abs(ascendant.longitude - ENSCHEDE_REFERENCE.expectedAscLongitude)
    ).toBeLessThanOrEqual(ENSCHEDE_REFERENCE.toleranceDeg);
    expect(ascendant.signName).toBe(ENSCHEDE_REFERENCE.expectedSignName);
  });

  it("eski hatalı kuadran değerine (303.5°) dönmez", () => {
    const ascendant = calculateAscendant(
      ENSCHEDE_REFERENCE.date,
      ENSCHEDE_REFERENCE.latitude,
      ENSCHEDE_REFERENCE.longitude
    );

    expect(Math.abs(ascendant.longitude - 303.50830687096277)).toBeGreaterThan(
      90
    );
  });
});
