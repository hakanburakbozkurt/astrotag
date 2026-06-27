import { describe, expect, it } from "vitest";
import { deductStarPointsBalance } from "@/lib/energy-charge";

describe("deductStarPointsBalance", () => {
  it("deducts from bonus before main balance", () => {
    expect(deductStarPointsBalance(50, 10, 7)).toEqual({
      starPoints: 50,
      starPointsBonus: 3,
    });
  });

  it("spills remaining cost into main balance after bonus is exhausted", () => {
    expect(deductStarPointsBalance(50, 10, 15)).toEqual({
      starPoints: 45,
      starPointsBonus: 0,
    });
  });

  it("deducts only from main balance when bonus is zero", () => {
    expect(deductStarPointsBalance(20, 0, 5)).toEqual({
      starPoints: 15,
      starPointsBonus: 0,
    });
  });
});
