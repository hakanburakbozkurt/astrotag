export {
  BIOMETRIC_PRESETS,
  SERVER_BIOMETRIC_FAILED,
  SERVER_BIOMETRIC_UNAVAILABLE,
  presentationForKind,
  type BiometricKind,
  type BiometricPresentation,
} from "@/lib/biometric/biometric-labels";

export {
  detectBiometricKind,
  detectBiometricPresentation,
  isPlatformAuthenticatorAvailable,
  DEVICE_SESSION_SIGNATURE_NOTE,
} from "@/lib/biometric/biometric-type.client";

export { useBiometricType } from "@/lib/biometric/useBiometricType";
