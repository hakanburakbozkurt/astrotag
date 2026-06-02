/**
 * Passkey / WebAuthn sırasında middleware device-bound kontrolünü geçici olarak gevşetir.
 * Edge (middleware) ve Node (server action) — Web Crypto ile imzalı kısa ömürlü token.
 */

export const BIOMETRIC_GRACE_COOKIE = "astrotag_bio_grace";

/** Face ID / Touch ID diyaloğu + sunucu tamamlama için yeterli süre */
export const BIOMETRIC_GRACE_TTL_MS = 5 * 60 * 1000;

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function getBiometricGraceSecret(): string | null {
  return (
    process.env.NFC_BIOMETRIC_GRACE_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null
  );
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createBiometricGraceToken(
  uniqueId: string
): Promise<string | null> {
  const secret = getBiometricGraceSecret();
  if (!secret) {
    return null;
  }

  const exp = Date.now() + BIOMETRIC_GRACE_TTL_MS;
  const payload = `${uniqueId.trim()}:${exp}`;
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifyBiometricGraceToken(
  token: string | undefined,
  expectedUniqueId: string | null
): Promise<boolean> {
  if (!token?.trim() || !expectedUniqueId?.trim()) {
    return false;
  }

  const secret = getBiometricGraceSecret();
  if (!secret) {
    return false;
  }

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) {
    return false;
  }

  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const colon = payload.indexOf(":");
  if (colon === -1) {
    return false;
  }

  const uid = payload.slice(0, colon);
  const exp = Number(payload.slice(colon + 1));

  if (uid !== expectedUniqueId.trim()) {
    return false;
  }

  if (!Number.isFinite(exp) || Date.now() > exp) {
    return false;
  }

  const expectedSig = await hmacSign(payload, secret);
  return timingSafeEqual(sig, expectedSig);
}
