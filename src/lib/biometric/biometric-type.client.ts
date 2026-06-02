"use client";

import {
  presentationForKind,
  type BiometricKind,
  type BiometricPresentation,
} from "@/lib/biometric/biometric-labels";

/**
 * Cihaz oturum imzası (astrotag_fingerprint çerezi) — biyometrik parmak izi DEĞİL.
 * Kullanıcı arayüzünde bu terim asla "parmak izi doğrulaması" olarak gösterilmez.
 */
export const DEVICE_SESSION_SIGNATURE_NOTE =
  "Teknik oturum imzası; Face ID / Touch ID ile karıştırılmamalıdır.";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

/** iPadOS 13+ masaüstü UA taklidi */
function isIPad(): boolean {
  if (!isBrowser()) {
    return false;
  }

  const ua = navigator.userAgent;
  if (/iPad/.test(ua)) {
    return true;
  }

  return (
    /Macintosh/.test(ua) &&
    navigator.maxTouchPoints > 1 &&
    !/iPhone/.test(ua)
  );
}

/**
 * Home tuşlu / Touch ID ağırlıklı iPhone (SE, 8 vb.) — viewport yüksekliği sezgisi.
 * Face ID iPhone’lar genelde daha uzun logical height kullanır (≥812).
 */
function isLikelyTouchIdIPhone(): boolean {
  if (!isBrowser() || !/iPhone/.test(navigator.userAgent)) {
    return false;
  }

  const height = Math.max(window.screen.height, window.screen.width);
  return height < 812;
}

/**
 * WebAuthn platform authenticator mevcut mu (Face ID / Touch ID / Android biometric).
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    typeof window.PublicKeyCredential === "undefined"
  ) {
    return false;
  }

  try {
    if (
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
      "function"
    ) {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * expo-local-authentication supportedAuthenticationTypes karşılığı yok;
 * UA + ekran + platform ile sezgisel algılama (iOS odaklı).
 */
export function detectBiometricKind(): BiometricKind {
  if (!isBrowser()) {
    return "unknown";
  }

  const ua = navigator.userAgent;

  if (/iPhone/.test(ua)) {
    return isLikelyTouchIdIPhone() ? "touchId" : "faceId";
  }

  if (isIPad()) {
    return "platform";
  }

  if (/Android/i.test(ua)) {
    return "fingerprint";
  }

  if (/Macintosh|Mac OS X/i.test(ua) && !isIPad()) {
    return "touchId";
  }

  if (/Windows/i.test(ua)) {
    return "platform";
  }

  return "unknown";
}

export function detectBiometricPresentation(): BiometricPresentation {
  return presentationForKind(detectBiometricKind());
}
