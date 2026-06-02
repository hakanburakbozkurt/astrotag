/**
 * Kullanıcıya gösterilen biyometrik metinler.
 * WebAuthn / Passkey (@simplewebauthn/browser) — expo-local-authentication kullanılmıyor.
 */

export type BiometricKind =
  | "faceId"
  | "touchId"
  | "fingerprint"
  | "platform"
  | "unknown";

export type BiometricPresentation = {
  kind: BiometricKind;
  /** Face ID, Touch ID, Parmak izi, Biyometrik */
  shortName: string;
  verifying: string;
  registering: string;
  promptRegister: string;
  promptButton: string;
  failed: string;
  unsupported: string;
  passkeyStepTitle: string;
};

const GENERIC: BiometricPresentation = {
  kind: "unknown",
  shortName: "Biyometrik",
  verifying: "Biyometrik doğrulama yapılıyor...",
  registering: "Biyometrik kayıt tamamlanıyor...",
  promptRegister:
    "Bu cihazı anahtarlığınıza bağlamak için biyometrik doğrulama (Passkey) kullanın.",
  promptButton: "Biyometrik Doğrulama ile Kaydet",
  failed: "Biyometrik doğrulama başarısız. Lütfen tekrar deneyin.",
  unsupported:
    "Bu cihazda biyometrik Passkey desteklenmiyor. iPhone’da Safari ile deneyin.",
  passkeyStepTitle: "Biyometrik Doğrulama",
};

const FACE_ID: BiometricPresentation = {
  kind: "faceId",
  shortName: "Face ID",
  verifying: "Face ID ile doğrulanıyor...",
  registering: "Face ID ile kaydediliyor...",
  promptRegister:
    "Bu cihazı anahtarlığınıza bağlamak için Face ID ile Passkey oluşturun.",
  promptButton: "Face ID ile Kaydet",
  failed: "Face ID doğrulaması başarısız. Lütfen tekrar deneyin.",
  unsupported:
    "Face ID kullanılamıyor. Ayarlar → Face ID ve Safari’de Passkey’i kontrol edin.",
  passkeyStepTitle: "Face ID",
};

const TOUCH_ID: BiometricPresentation = {
  kind: "touchId",
  shortName: "Touch ID",
  verifying: "Touch ID ile doğrulanıyor...",
  registering: "Touch ID ile kaydediliyor...",
  promptRegister:
    "Bu cihazı anahtarlığınıza bağlamak için Touch ID ile Passkey oluşturun.",
  promptButton: "Touch ID ile Kaydet",
  failed: "Touch ID doğrulaması başarısız. Lütfen tekrar deneyin.",
  unsupported:
    "Touch ID kullanılamıyor. Ayarlar’da Touch ID ve Safari Passkey’i kontrol edin.",
  passkeyStepTitle: "Touch ID",
};

const FINGERPRINT: BiometricPresentation = {
  kind: "fingerprint",
  shortName: "Parmak izi",
  verifying: "Parmak izi ile doğrulanıyor...",
  registering: "Parmak izi ile kaydediliyor...",
  promptRegister:
    "Bu cihazı anahtarlığınıza bağlamak için parmak izi sensörü ile Passkey oluşturun.",
  promptButton: "Parmak İzi ile Kaydet",
  failed: "Parmak izi doğrulaması başarısız. Lütfen tekrar deneyin.",
  unsupported: "Parmak izi sensörü veya Passkey bu cihazda kullanılamıyor.",
  passkeyStepTitle: "Parmak İzi",
};

const PLATFORM: BiometricPresentation = {
  kind: "platform",
  shortName: "Face ID veya Touch ID",
  verifying: "Biyometrik doğrulama yapılıyor...",
  registering: "Biyometrik kayıt tamamlanıyor...",
  promptRegister:
    "Bu cihazı anahtarlığınıza bağlamak için Face ID veya Touch ID ile Passkey oluşturun.",
  promptButton: "Passkey ile Kaydet",
  failed: "Biyometrik doğrulama başarısız. Lütfen tekrar deneyin.",
  unsupported:
    "Bu cihaz Passkey desteklemiyor. Safari veya Chrome kullanın.",
  passkeyStepTitle: "Biyometrik Doğrulama",
};

export const BIOMETRIC_PRESETS = {
  generic: GENERIC,
  faceId: FACE_ID,
  touchId: TOUCH_ID,
  fingerprint: FINGERPRINT,
  platform: PLATFORM,
} as const;

export function presentationForKind(kind: BiometricKind): BiometricPresentation {
  switch (kind) {
    case "faceId":
      return FACE_ID;
    case "touchId":
      return TOUCH_ID;
    case "fingerprint":
      return FINGERPRINT;
    case "platform":
      return PLATFORM;
    default:
      return GENERIC;
  }
}

/** Sunucu tarafı — istemci algılaması yokken genel metin */
export const SERVER_BIOMETRIC_FAILED =
  "Biyometrik doğrulama başarısız. Lütfen tekrar deneyin.";

export const SERVER_BIOMETRIC_UNAVAILABLE =
  "Biyometrik doğrulama başlatılamadı. Cihaz ayarlarında Passkey’i etkinleştirin.";
