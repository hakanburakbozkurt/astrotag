export const SITE_URL = "https://astrotag.vercel.app";

export const HOME_PATH = "/";

export const NFC_SESSION_COOKIE = "astrotag_nfc_session";
export const NFC_FINGERPRINT_COOKIE = "astrotag_fingerprint";
export const STORAGE_VERIFIED_COOKIE = "astrotag_storage_ok";

/** Sunucu oturum tavanı (dakika) — istemci daha erken sonlandırır */
export const NFC_SESSION_TTL_MINUTES = 30;

/** 10 dk etkileşimsizlik → oturum sonu */
export const SESSION_INACTIVITY_MS = 10 * 60 * 1000;

/** 5 dk arka planda kalma → oturum sonu */
export const SESSION_BACKGROUND_MS = 5 * 60 * 1000;

export const SESSION_EXPIRED_PATH = "/session-expired";
export const PRIVATE_MODE_PATH = "/private-mode-warning";
/** @deprecated */
export const LOGIN_PATH = HOME_PATH;
export const PROFILE_COMPLETE_PATH = "/profile/complete";
export const CARD_ENTRY_PREFIX = "/c";

export const WELCOME_IMAGE_PATH = "/image_485027.png";

export const NFC_SHOP_URL =
  process.env.NEXT_PUBLIC_NFC_SHOP_URL ?? "https://astrotag.vercel.app";

export const PUBLIC_PATHS = new Set([
  HOME_PATH,
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
