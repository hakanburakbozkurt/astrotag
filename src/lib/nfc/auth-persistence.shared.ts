import { NFC_AUTH_PERSISTENCE_MS } from "@/lib/nfc/constants";

export function isWithinAuthPersistenceWindow(
  lastLoginAt: string | null | undefined
): boolean {
  if (!lastLoginAt?.trim()) {
    return false;
  }

  const parsed = Date.parse(lastLoginAt);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return Date.now() - parsed < NFC_AUTH_PERSISTENCE_MS;
}
