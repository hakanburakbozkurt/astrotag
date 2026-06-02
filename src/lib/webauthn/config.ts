import "server-only";

import { SITE_URL } from "@/lib/nfc/constants";

export function getWebAuthnOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return SITE_URL;
}

export function getWebAuthnRpId(): string {
  const explicit = process.env.WEBAUTHN_RP_ID?.trim();
  if (explicit) {
    return explicit;
  }

  try {
    return new URL(getWebAuthnOrigin()).hostname;
  } catch {
    return "localhost";
  }
}

export function getWebAuthnRpName(): string {
  return process.env.WEBAUTHN_RP_NAME?.trim() || "AstroTag";
}

export function isWebAuthnSupportedUserAgent(userAgent: string): boolean {
  return /iPhone|iPad|Macintosh|Android/i.test(userAgent);
}
