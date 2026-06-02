import "server-only";

import { cookies } from "next/headers";
import {
  BIOMETRIC_GRACE_COOKIE,
  createBiometricGraceToken,
} from "@/lib/nfc/biometric-grace";
import {
  NFC_SESSION_TTL_MINUTES,
  TRUSTED_DEVICE_COOKIE,
  TRUSTED_NFC_COOKIE,
  WEBAUTHN_CHALLENGE_COOKIE,
} from "@/lib/nfc/constants";

/** iOS Safari uyumu: HttpOnly + Secure + SameSite=Strict */
export function getStrictCookieOptions(expiresAt?: Date) {
  const expires =
    expiresAt ??
    new Date(Date.now() + NFC_SESSION_TTL_MINUTES * 60 * 1000);

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires,
  };
}

export function getStrictClearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 0,
  };
}

export async function getTrustedDeviceFromCookies(): Promise<{
  nfcId: string | null;
  deviceToken: string | null;
}> {
  const cookieStore = await cookies();
  return {
    nfcId: cookieStore.get(TRUSTED_NFC_COOKIE)?.value?.trim() ?? null,
    deviceToken: cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value?.trim() ?? null,
  };
}

export async function setTrustedDeviceCookies(
  nfcId: string,
  deviceToken: string
): Promise<void> {
  const cookieStore = await cookies();
  const options = getStrictCookieOptions();

  cookieStore.set(TRUSTED_NFC_COOKIE, nfcId.trim(), options);
  cookieStore.set(TRUSTED_DEVICE_COOKIE, deviceToken.trim(), options);
}

export async function clearTrustedDeviceCookies(): Promise<void> {
  const cookieStore = await cookies();
  const clear = getStrictClearCookieOptions();

  cookieStore.set(TRUSTED_DEVICE_COOKIE, "", clear);
  cookieStore.set(TRUSTED_NFC_COOKIE, "", clear);
}

export async function setWebAuthnChallengeCookie(
  challenge: string
): Promise<void> {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  cookieStore.set(WEBAUTHN_CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires,
  });
}

export async function consumeWebAuthnChallengeCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(WEBAUTHN_CHALLENGE_COOKIE)?.value?.trim() ?? null;

  cookieStore.set(WEBAUTHN_CHALLENGE_COOKIE, "", getStrictClearCookieOptions());

  return value;
}

/** Passkey diyaloğu açılmadan önce — middleware device-bound kontrolünü geçici gevşetir */
export async function setBiometricGraceCookie(uniqueId: string): Promise<void> {
  const token = await createBiometricGraceToken(uniqueId);
  if (!token) {
    return;
  }

  const cookieStore = await cookies();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  cookieStore.set(BIOMETRIC_GRACE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires,
  });
}

export async function clearBiometricGraceCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(BIOMETRIC_GRACE_COOKIE, "", getStrictClearCookieOptions());
}
