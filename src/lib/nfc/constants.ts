export const NFC_SESSION_COOKIE = "astrotag_nfc_session";
export const NFC_FINGERPRINT_COOKIE = "astrotag_fingerprint";
export const STORAGE_VERIFIED_COOKIE = "astrotag_storage_ok";

/** Ephemeral oturum süresi (dakika) */
export const NFC_SESSION_TTL_MINUTES = 5;

export const SESSION_EXPIRED_PATH = "/session-expired";
export const PRIVATE_MODE_PATH = "/private-mode-warning";
/** @deprecated Eski login rotası */
export const LOGIN_PATH = SESSION_EXPIRED_PATH;
export const PROFILE_COMPLETE_PATH = "/profile/complete";
export const CARD_ENTRY_PREFIX = "/c";

export const PUBLIC_PATHS = new Set([
  "/",
  SESSION_EXPIRED_PATH,
  PRIVATE_MODE_PATH,
  "/manifest.json",
  "/sw.js",
]);

export const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/profile",
  "/api/ai",
] as const;

export const NFC_CARD_INACTIVE_MESSAGE = "Bu NFC kartı aktif değil.";
export const NFC_FINGERPRINT_MISMATCH_MESSAGE =
  "Oturum Sona Erdi veya Geçersiz Erişim";

/** @deprecated use NFC_FINGERPRINT_COOKIE */
export const NFC_DEVICE_COOKIE = NFC_FINGERPRINT_COOKIE;
