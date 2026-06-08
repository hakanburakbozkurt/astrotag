import {
  CARD_ENTRY_PREFIX,
  NFC_PAIRING_QUERY,
  PUBLIC_PROFILE_PREFIX,
} from "@/lib/nfc/constants";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

/** Korunan tek-segment rotalar — /{unique_id} kart girişi değildir */
export const RESERVED_ROOT_SEGMENTS = new Set([
  "dashboard",
  "auth",
  "profile",
  "c",
  "p",
  "verify-otp",
  "login",
  "session-expired",
  "private-mode-warning",
  "api",
  "manifest.json",
  "sw.js",
]);

export function extractRootUniqueId(pathname: string): string | null {
  const trimmed =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const match = trimmed.match(/^\/([^/]+)$/);

  if (!match?.[1]) {
    return null;
  }

  let segment = match[1];
  try {
    segment = decodeURIComponent(segment);
  } catch {
    // ham segment
  }

  if (RESERVED_ROOT_SEGMENTS.has(segment)) {
    return null;
  }

  return normalizeNfcUniqueId(segment);
}

export function isRootCardEntryPath(pathname: string): boolean {
  return extractRootUniqueId(pathname) !== null;
}

/** astrotag.app/{unique_id} */
export function cardEntryPathForUniqueId(uniqueId: string): string {
  return `/${encodeURIComponent(normalizeNfcUniqueId(uniqueId))}`;
}

/** @deprecated NFC etiketleri /c/ kullanıyorsa geriye dönük */
export function legacyCardEntryPathForUniqueId(uniqueId: string): string {
  return `${CARD_ENTRY_PREFIX}/${encodeURIComponent(normalizeNfcUniqueId(uniqueId))}`;
}

export function publicProfilePathForUniqueId(uniqueId: string): string {
  return `${PUBLIC_PROFILE_PREFIX}/${encodeURIComponent(uniqueId.trim())}`;
}

export function nfcPairingPathForUniqueId(uniqueId: string): string {
  return `${cardEntryPathForUniqueId(uniqueId)}?${NFC_PAIRING_QUERY}=1`;
}
