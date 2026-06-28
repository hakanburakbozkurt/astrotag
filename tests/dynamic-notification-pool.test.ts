import { describe, expect, it } from "vitest";
import {
  DYNAMIC_NOTIFICATION_POOL,
  resolveNotificationMessage,
} from "@/lib/notifications/dynamic-notification-pool";
import { pickRandomUnseen } from "@/lib/notifications/seen-notifications";

describe("dynamic notification pool", () => {
  it("has entries for each stress level", () => {
    expect(DYNAMIC_NOTIFICATION_POOL.some((item) => item.stressLevel === "calm")).toBe(true);
    expect(DYNAMIC_NOTIFICATION_POOL.some((item) => item.stressLevel === "moderate")).toBe(
      true
    );
    expect(DYNAMIC_NOTIFICATION_POOL.some((item) => item.stressLevel === "high")).toBe(true);
  });

  it("resolves personalized messages", () => {
    const calmEntry = DYNAMIC_NOTIFICATION_POOL.find((item) => item.id === "calm-nexus-flow");
    expect(calmEntry).toBeDefined();

    const message = resolveNotificationMessage(calmEntry!, { userName: "Ayşe" });
    expect(message).toContain("Ayşe");
  });

  it("includes route on every pool item", () => {
    for (const item of DYNAMIC_NOTIFICATION_POOL) {
      expect(item.route.startsWith("/dashboard/")).toBe(true);
    }
  });
});

describe("pickRandomUnseen", () => {
  it("returns null for empty pool", () => {
    expect(pickRandomUnseen([])).toBeNull();
  });
});
