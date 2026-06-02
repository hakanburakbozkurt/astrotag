"use client";

/**
 * userAgent + screen.width + screen.height → SHA-256 fingerprint
 */
export async function getDeviceFingerprint(): Promise<string> {
  const parts = [
    navigator.userAgent,
    String(screen.width),
    String(screen.height),
  ];

  const raw = parts.join("|");
  const encoded = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getFingerprintRawPayload(): string {
  return [navigator.userAgent, String(screen.width), String(screen.height)].join(
    "|"
  );
}
