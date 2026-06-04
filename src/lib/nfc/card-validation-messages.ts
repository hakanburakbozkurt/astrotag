import { NFC_CARD_INACTIVE_MESSAGE } from "@/lib/nfc/constants";
import type { NfcCardValidationFailure } from "@/lib/nfc/session.server";

export function nfcCardValidationErrorMessage(
  reason: NfcCardValidationFailure["reason"]
): string {
  switch (reason) {
    case "config_error":
      return "Sunucu yapılandırması eksik (Supabase service role).";
    case "db_error":
      return "Kart doğrulanırken veritabanı hatası oluştu.";
    case "not_found":
    case "inactive":
    default:
      return NFC_CARD_INACTIVE_MESSAGE;
  }
}
