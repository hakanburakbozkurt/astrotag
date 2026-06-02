/**
 * Edge-safe oturum imzası yardımcıları (middleware uyumlu).
 * "fingerprint" = cihaz/oturum hash'i; biyometrik parmak izi veya Face ID DEĞİL.
 */

export function isValidFingerprintHash(value: string | undefined | null): boolean {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

export async function hashFingerprintPayload(
  userAgent: string,
  screenWidth: number,
  screenHeight: number
): Promise<string> {
  const raw = [userAgent, String(screenWidth), String(screenHeight)].join("|");
  const encoded = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
