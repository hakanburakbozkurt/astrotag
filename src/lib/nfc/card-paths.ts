import {
  CARD_ENTRY_PREFIX,
  NFC_PAIRING_QUERY,
  PUBLIC_PROFILE_PREFIX,
} from "@/lib/nfc/constants";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

export function cardEntryPathForUniqueId(uniqueId: string): string {
  return `${CARD_ENTRY_PREFIX}/${encodeURIComponent(normalizeNfcUniqueId(uniqueId))}`;
}

export function publicProfilePathForUniqueId(uniqueId: string): string {
  return `${PUBLIC_PROFILE_PREFIX}/${encodeURIComponent(uniqueId.trim())}`;
}

export function nfcPairingPathForUniqueId(uniqueId: string): string {
  return `${cardEntryPathForUniqueId(uniqueId)}?${NFC_PAIRING_QUERY}=1`;
}
