export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://astrotag.app";

export const HOME_PATH = "/";

export const NFC_SESSION_COOKIE = "astrotag_nfc_session";
export const NFC_FINGERPRINT_COOKIE = "astrotag_fingerprint";
/** nfc_sessions.profile_id ile aynı — oturum çerezi yanında hızlı doğrulama */
export const NFC_PROFILE_COOKIE = "astrotag_nfc_profile";
export const STORAGE_VERIFIED_COOKIE = "astrotag_storage_ok";
/** E-posta doğrulama / eşleştirme sırasında kartı hatırla (middleware yönlendirmesi) */
export const PENDING_NFC_COOKIE = "astrotag_pending_nfc";
export const NFC_PAIRING_QUERY = "pair";
/** Oturum çerezi + DB kaydı süresi (gün) — çerez silinene kadar oturum sürer */
export const NFC_SESSION_TTL_DAYS = 365;

/** @deprecated NFC_SESSION_TTL_DAYS kullan */
export const NFC_SESSION_TTL_MINUTES = NFC_SESSION_TTL_DAYS * 24 * 60;

export const SESSION_EXPIRED_PATH = "/session-expired";
export const PRIVATE_MODE_PATH = "/private-mode-warning";
/** @deprecated */
export const LOGIN_PATH = HOME_PATH;
export const DASHBOARD_PATH = "/dashboard";
export const PROFILE_COMPLETE_PATH = "/profile/complete";
export const PROFILE_SETUP_PATH = "/profile-setup";
/** PIN sonrası eksik profil — nfc_user_data full_name / birth_date */
export const REGISTRATION_COMPLETE_PATH = "/kayit-tamamla";
export const CARD_ENTRY_PREFIX = "/c";
/** NFC ile açılan herkese açık profil */
export const PUBLIC_PROFILE_PREFIX = "/p";

export const WELCOME_IMAGE_PATH = "/image_485027.png";

export const NFC_SHOP_URL =
  process.env.NEXT_PUBLIC_NFC_SHOP_URL ?? "https://astrotag.app";

export const SITE_HOST = "astrotag.app";

export const VERIFY_OTP_PATH = "/verify-otp";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const AUTH_SIGNUP_PATH = "/auth/signup";
export const AUTH_LOGIN_PATH = "/auth/login";
/** auth/signup|login ?msg= — pasif kart acil giriş */
export const AUTH_MSG_CARD_NOT_ACTIVE = "card_not_active";

export const PUBLIC_PATHS = new Set([
  HOME_PATH,
  PRIVATE_MODE_PATH,
  VERIFY_OTP_PATH,
  AUTH_CALLBACK_PATH,
  AUTH_SIGNUP_PATH,
  AUTH_LOGIN_PATH,
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

export const NFC_CARD_OWNED_BY_OTHER_MESSAGE = "Bu kart başkasına ait.";

export const CARD_VERIFY_FAILURE_MESSAGE = "Hatalı Bilgi";

/** nfc_user_data'da kart kaydı yok veya oturum FK hedefi geçersiz */
export const INVALID_NFC_CARD_MESSAGE = "Geçersiz Kart";

/** pin_code eşleşmedi */
export const INVALID_PIN_MESSAGE = "Hatalı şifre";

/** @deprecated use NFC_FINGERPRINT_COOKIE */
export const NFC_DEVICE_COOKIE = NFC_FINGERPRINT_COOKIE;
