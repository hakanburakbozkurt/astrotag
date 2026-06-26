import { describe, expect, it } from "vitest";
import { sunSignFromBirthDate } from "@/lib/astrology/sun-sign";

describe("sun-sign", () => {
  it("resolves tropical sun signs from ISO birth dates", () => {
    expect(sunSignFromBirthDate("1990-03-25")).toBe("Koç");
    expect(sunSignFromBirthDate("1990-07-28")).toBe("Aslan");
    expect(sunSignFromBirthDate("1990-01-10")).toBe("Oğlak");
    expect(sunSignFromBirthDate("1990-01-25")).toBe("Kova");
  });

  it("returns null for invalid dates", () => {
    expect(sunSignFromBirthDate("")).toBeNull();
    expect(sunSignFromBirthDate("invalid")).toBeNull();
  });
});
