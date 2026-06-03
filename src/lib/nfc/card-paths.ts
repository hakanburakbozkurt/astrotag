import { CARD_ENTRY_PREFIX, NFC_PAIRING_QUERY } from "@/lib/nfc/constants";

export function cardEntryPathForUniqueId(uniqueId: string): string {
  return `${CARD_ENTRY_PREFIX}/${encodeURIComponent(uniqueId.trim())}`;
}

export function nfcPairingPathForUniqueId(uniqueId: string): string {
  return `${cardEntryPathForUniqueId(uniqueId)}?${NFC_PAIRING_QUERY}=1`;
}
