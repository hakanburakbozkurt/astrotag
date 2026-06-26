import "server-only";

import {
  NFC_AUTH_PERSISTENCE_MS,
  NFC_SESSION_TTL_MS,
} from "@/lib/nfc/constants";
import { isWithinAuthPersistenceWindow } from "@/lib/nfc/auth-persistence.shared";
import {
  isNfcSessionExpired,
  type NfcSessionRow,
} from "@/lib/nfc/nfc-session-activity.server";

export function isClientLastLoginWithinWindow(
  clientLastLoginMs: number | null | undefined
): boolean {
  if (clientLastLoginMs == null || !Number.isFinite(clientLastLoginMs)) {
    return false;
  }

  return Date.now() - clientLastLoginMs < NFC_AUTH_PERSISTENCE_MS;
}

export function isPersistenceAnchorValid(
  cookieLastLoginAt: string | null | undefined,
  clientLastLoginMs?: number | null
): boolean {
  return (
    isWithinAuthPersistenceWindow(cookieLastLoginAt) ||
    isClientLastLoginWithinWindow(clientLastLoginMs ?? null)
  );
}

/** nfc_sessions — expires_at + last_active_at 24 saat kuralına uygun mu? */
export function isNfcSessionTwentyFourHourPolicyValid(
  session: Pick<NfcSessionRow, "expires_at" | "last_active_at">
): boolean {
  if (isNfcSessionExpired(session.expires_at)) {
    return false;
  }

  const expiresMs = Date.parse(session.expires_at);
  if (Number.isNaN(expiresMs)) {
    return false;
  }

  const remainingMs = expiresMs - Date.now();
  if (remainingMs < 0 || remainingMs > NFC_SESSION_TTL_MS + 60_000) {
    return false;
  }

  if (session.last_active_at?.trim()) {
    const lastActiveMs = Date.parse(session.last_active_at);
    if (
      !Number.isNaN(lastActiveMs) &&
      Date.now() - lastActiveMs > NFC_AUTH_PERSISTENCE_MS
    ) {
      return false;
    }
  }

  return true;
}
