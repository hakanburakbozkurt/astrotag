"use client";

import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { detectBiometricPresentation } from "@/lib/biometric/biometric-type.client";

export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

function getBiometricLabels() {
  return detectBiometricPresentation();
}

export async function registerPasskeyOnDevice(
  options: PublicKeyCredentialCreationOptionsJSON
): Promise<RegistrationResponseJSON> {
  const bio = getBiometricLabels();

  if (!isPasskeySupported()) {
    throw new Error(bio.unsupported);
  }

  try {
    return await startRegistration({ optionsJSON: options });
  } catch (error) {
    if (error instanceof Error && error.name === "NotAllowedError") {
      throw new Error(
        `${bio.shortName} doğrulaması iptal edildi veya zaman aşımına uğradı.`
      );
    }
    throw error;
  }
}

export async function authenticatePasskeyOnDevice(
  options: PublicKeyCredentialRequestOptionsJSON
): Promise<AuthenticationResponseJSON> {
  const bio = getBiometricLabels();

  if (!isPasskeySupported()) {
    throw new Error(bio.unsupported);
  }

  try {
    return await startAuthentication({ optionsJSON: options });
  } catch (error) {
    if (error instanceof Error && error.name === "NotAllowedError") {
      throw new Error(
        `${bio.shortName} doğrulaması iptal edildi veya zaman aşımına uğradı.`
      );
    }
    throw error;
  }
}
