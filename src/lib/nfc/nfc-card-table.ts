import "server-only";

/**
 * Production NFC kart kaynağı.
 *
 * DB sütun sözleşmesi (tip uyumu kritik):
 * - id (uuid)     — kart PK; kodda nfcCardUuid / row.id
 * - nfc_id (text) — URL slug at_xxx; kodda uniqueId / NFC_CARD_SLUG_COLUMN
 *
 * nfc_sessions.nfc_id (uuid) → bu tablonun id sütununa FK (slug değil).
 */
export const NFC_CARD_TABLE = "nfc_user_data" as const;
export const NFC_CARD_SLUG_COLUMN = "nfc_id" as const;

/** PIN girişi — nfc_user_data (handlePinLogin / verifyPin) */
export const NFC_CARD_PIN_LOGIN_SELECT =
  "id, nfc_id, profile_id, is_active, pin_hash, pin_failed_attempts, pin_locked_until" as const;

export const NFC_CARD_AUTH_SELECT =
  "id, is_active, profile_id, is_claimed, owner_id" as const;

export const NFC_CARD_PIN_SELECT =
  "id, profile_id, is_active, pin_hash, pin_failed_attempts, pin_locked_until, full_name, birth_date, birth_time, birth_location" as const;

/** PIN doğrulama — yalnızca auth sütunları (hızlı sorgu; profil alanları ayrı okunur) */
export const NFC_CARD_VERIFY_SELECT =
  "id, profile_id, is_active, pin_hash, pin_failed_attempts, pin_locked_until" as const;

export const NFC_CARD_PROFILE_SELECT =
  "full_name, birth_date, birth_time, birth_location" as const;

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
