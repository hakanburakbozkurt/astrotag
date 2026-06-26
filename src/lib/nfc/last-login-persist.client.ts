import { NFC_AUTH_PERSISTENCE_MS } from "@/lib/nfc/constants";

const LAST_LOGIN_STORAGE_KEY = "astrotag_last_login_at";

export function recordClientLastLogin(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(LAST_LOGIN_STORAGE_KEY, String(Date.now()));
  } catch {
    // private mode / quota
  }
}

export function getClientLastLoginTimestamp(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(LAST_LOGIN_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const timestamp = Number(raw);
    return Number.isFinite(timestamp) ? timestamp : null;
  } catch {
    return null;
  }
}

export function isClientAuthPersistenceValid(): boolean {
  const timestamp = getClientLastLoginTimestamp();
  if (timestamp == null) {
    return false;
  }

  return Date.now() - timestamp < NFC_AUTH_PERSISTENCE_MS;
}

export function clearClientLastLogin(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(LAST_LOGIN_STORAGE_KEY);
  } catch {
    // ignore
  }
}
