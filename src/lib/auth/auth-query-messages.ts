import { AUTH_MSG_CARD_NOT_ACTIVE } from "@/lib/nfc/constants";

const CARD_NOT_ACTIVE_COPY =
  "Kartınız henüz aktif değil. Lütfen kartı aktifleştirmek için giriş yapın veya kayıt olun.";

/** URL ?msg= değerini kullanıcı metnine çevirir */
export function authQueryMessageText(msg: string | null | undefined): string | null {
  const key = msg?.trim();
  if (!key) {
    return null;
  }

  if (key === AUTH_MSG_CARD_NOT_ACTIVE) {
    return CARD_NOT_ACTIVE_COPY;
  }

  return key;
}
