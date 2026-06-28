import { describe, expect, it } from "vitest";
import { isStaleServerActionError } from "@/lib/errors/stale-server-action";

describe("isStaleServerActionError", () => {
  it("matches failed to find server action", () => {
    expect(
      isStaleServerActionError(new Error("Failed to find Server Action \"abc123\"."))
    ).toBe(true);
  });

  it("matches deployment mismatch copy", () => {
    expect(
      isStaleServerActionError(
        new Error("This request might be from an older or newer deployment.")
      )
    ).toBe(true);
  });

  it("matches server action + not found together", () => {
    expect(isStaleServerActionError(new Error("Server Action not found"))).toBe(true);
  });

  it("does not match generic not found errors", () => {
    expect(isStaleServerActionError(new Error("User not found"))).toBe(false);
    expect(isStaleServerActionError(new Error("404 Not Found"))).toBe(false);
  });

  it("does not match unrelated application errors", () => {
    expect(isStaleServerActionError(new Error("Oturum bulunamadı."))).toBe(false);
  });
});
