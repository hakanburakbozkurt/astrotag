export const NFC_SESSION_COOKIE = "astrotag_nfc_session";

export const NFC_SESSION_TTL_DAYS = 30;

export const NFC_AUTH_ERROR_MESSAGE = "Geçersiz veya Kullanılmış Kilit";

export const NFC_CARD_ALREADY_USED_MESSAGE =
  "Bu kart daha önce kullanılmış ve geçersiz";

export const LOGIN_PATH = "/login";

export const PROFILE_COMPLETE_PATH = "/profile/complete";

export const PROTECTED_PATH_PREFIXES = ["/dashboard", "/profile/complete", "/profile"] as const;

export const PUBLIC_PATHS = new Set(["/", "/login"]);
