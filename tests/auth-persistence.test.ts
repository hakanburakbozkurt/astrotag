import { describe, expect, it } from "vitest";
import { isWithinAuthPersistenceWindow } from "@/lib/nfc/auth-persistence.shared";
import { NFC_AUTH_PERSISTENCE_MS } from "@/lib/nfc/constants";

describe("auth-persistence", () => {
  it("accepts login within 24 hours", () => {
    const recent = new Date(Date.now() - 60_000).toISOString();
    expect(isWithinAuthPersistenceWindow(recent)).toBe(true);
  });

  it("rejects login older than 24 hours", () => {
    const stale = new Date(Date.now() - NFC_AUTH_PERSISTENCE_MS - 1).toISOString();
    expect(isWithinAuthPersistenceWindow(stale)).toBe(false);
  });
});
