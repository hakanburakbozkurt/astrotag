import "server-only";
import { createHash } from "crypto";

export { isValidFingerprintHash } from "@/lib/nfc/fingerprint-utils";

export function hashFingerprintPayload(
  userAgent: string,
  screenWidth: number,
  screenHeight: number
): string {
  const raw = [userAgent, String(screenWidth), String(screenHeight)].join("|");
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
