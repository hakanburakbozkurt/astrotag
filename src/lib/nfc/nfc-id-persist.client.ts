"use client";

import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

const SESSION_KEY = "astrotag_nfc_id_client";

/** useEffect içinde — sunucu action çağırmadan kart kimliğini sakla */
export function persistNfcIdClient(uniqueId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(SESSION_KEY, normalizeNfcUniqueId(uniqueId));
}

export function readNfcIdClient(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = sessionStorage.getItem(SESSION_KEY)?.trim();
  return stored ? normalizeNfcUniqueId(stored) : null;
}
