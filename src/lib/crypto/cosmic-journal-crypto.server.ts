import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ENCRYPTION_PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function resolveEncryptionKey(): Buffer {
  const raw =
    process.env.COSMIC_JOURNAL_ENCRYPTION_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!raw) {
    throw new Error("COSMIC_JOURNAL_ENCRYPTION_KEY yapılandırılmamış.");
  }

  return createHash("sha256").update(raw).digest();
}

export function encryptCosmicJournalText(plaintext: string): string {
  const key = resolveEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return `${ENCRYPTION_PREFIX}${payload}`;
}

export function decryptCosmicJournalText(stored: string): string {
  if (!stored.startsWith(ENCRYPTION_PREFIX)) {
    return stored;
  }

  const key = resolveEncryptionKey();
  const buffer = Buffer.from(stored.slice(ENCRYPTION_PREFIX.length), "base64");

  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8"
  );
}

export function isEncryptedCosmicJournalText(value: string): boolean {
  return value.startsWith(ENCRYPTION_PREFIX);
}
