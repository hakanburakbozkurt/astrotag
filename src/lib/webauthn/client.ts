"use client";

import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

export async function registerPasskeyOnDevice(
  options: PublicKeyCredentialCreationOptionsJSON
): Promise<RegistrationResponseJSON> {
  if (!isPasskeySupported()) {
    throw new Error(
      "Bu cihaz Passkey (Face ID / Touch ID) desteklemiyor. Safari veya Chrome kullanın."
    );
  }

  return startRegistration({ optionsJSON: options });
}

export async function authenticatePasskeyOnDevice(
  options: PublicKeyCredentialRequestOptionsJSON
): Promise<AuthenticationResponseJSON> {
  if (!isPasskeySupported()) {
    throw new Error("Passkey doğrulaması bu cihazda kullanılamıyor.");
  }

  return startAuthentication({ optionsJSON: options });
}
