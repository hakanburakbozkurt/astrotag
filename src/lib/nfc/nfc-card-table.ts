import "server-only";

/**
 * Production NFC kart kaynağı.
 * URL slug (at_xxx) sütunu: nfc_id — eski nfc_cards.unique_id karşılığı.
 */
export const NFC_CARD_TABLE = "nfc_user_data" as const;
export const NFC_CARD_SLUG_COLUMN = "nfc_id" as const;

export const NFC_CARD_AUTH_SELECT =
  "id, is_active, profile_id, is_claimed, owner_id" as const;

export const NFC_CARD_PIN_SELECT =
  "id, profile_id, is_active, pin_hash, pin_failed_attempts, pin_locked_until" as const;

export const NFC_CARD_META_SELECT =
  "nfc_id, is_claimed, owner_id, is_active" as const;

export const NFC_CARD_OWNERSHIP_SELECT =
  "id, profile_id, is_active, is_claimed, owner_id" as const;

export const NFC_CARD_PROFILE_LINK_SELECT = "id, profile_id" as const;

export function nfcCardQueryMeta(
  searchedSlug: string,
  rawSlug?: string,
  select: string = NFC_CARD_AUTH_SELECT
) {
  return {
    table: NFC_CARD_TABLE,
    column: NFC_CARD_SLUG_COLUMN,
    searchedId: searchedSlug,
    rawUniqueId: rawSlug ?? searchedSlug,
    select,
  };
}
