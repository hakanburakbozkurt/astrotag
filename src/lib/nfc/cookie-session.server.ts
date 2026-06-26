import "server-only";

import { cookies } from "next/headers";
import {
  NFC_CARD_COOKIE,
  NFC_LAST_LOGIN_AT_COOKIE,
  NFC_PROFILE_COOKIE,
  NFC_PROFILE_READY_COOKIE,
  NFC_SESSION_COOKIE,
  NFC_SESSION_EXPIRES_COOKIE,
  PROFILE_EDIT_MODE_COOKIE,
  POST_AUTH_RETURN_TO_COOKIE,
  NFC_SESSION_TTL_MS,
} from "@/lib/nfc/constants";
import {
  isNfcUuid,
  readCookieSessionSnapshot,
  type CookieSessionSnapshot,
} from "@/lib/nfc/cookie-session.shared";
import {
  getStrictClearCookieOptions,
  getStrictCookieOptions,
} from "@/lib/nfc/device-cookies.server";

export type { CookieSessionSnapshot };

export async function readServerCookieSessionAsync(): Promise<CookieSessionSnapshot | null> {
  const cookieStore = await cookies();

  return readCookieSessionSnapshot(cookieStore, {
    session: NFC_SESSION_COOKIE,
    profile: NFC_PROFILE_COOKIE,
    card: NFC_CARD_COOKIE,
    expires: NFC_SESSION_EXPIRES_COOKIE,
    profileReady: NFC_PROFILE_READY_COOKIE,
  });
}

export async function setNfcSessionCookieBundle(params: {
  sessionId: string;
  profileId: string;
  nfcCardUuid: string;
  expiresAt: Date;
  profileReady?: boolean;
}): Promise<void> {
  const sessionId = params.sessionId.trim();
  const profileId = params.profileId.trim();
  const nfcCardUuid = params.nfcCardUuid.trim();

  if (!isNfcUuid(sessionId) || !isNfcUuid(profileId) || !isNfcUuid(nfcCardUuid)) {
    throw new Error("NFC çerez değerleri geçersiz UUID.");
  }

  const cookieStore = await cookies();
  const cookieOptions = getStrictCookieOptions(params.expiresAt);

  cookieStore.set(NFC_SESSION_COOKIE, sessionId, cookieOptions);
  cookieStore.set(NFC_PROFILE_COOKIE, profileId, cookieOptions);
  cookieStore.set(NFC_CARD_COOKIE, nfcCardUuid, cookieOptions);
  cookieStore.set(
    NFC_SESSION_EXPIRES_COOKIE,
    params.expiresAt.toISOString(),
    cookieOptions
  );
  cookieStore.set(
    NFC_PROFILE_READY_COOKIE,
    params.profileReady ? "1" : "0",
    cookieOptions
  );
}

export async function setProfileReadyCookie(profileReady: boolean): Promise<void> {
  const snapshot = await readServerCookieSessionAsync();
  if (!snapshot) {
    return;
  }

  const cookieStore = await cookies();
  const expiresAt = snapshot.expiresAt
    ? new Date(snapshot.expiresAt)
    : new Date(Date.now() + NFC_SESSION_TTL_MS);

  cookieStore.set(
    NFC_PROFILE_READY_COOKIE,
    profileReady ? "1" : "0",
    getStrictCookieOptions(expiresAt)
  );
}

export async function clearNfcSessionCookieBundle(): Promise<void> {
  const clearOptions = getStrictClearCookieOptions();
  const cookieStore = await cookies();

  cookieStore.set(NFC_SESSION_COOKIE, "", clearOptions);
  cookieStore.set(NFC_PROFILE_COOKIE, "", clearOptions);
  cookieStore.set(NFC_CARD_COOKIE, "", clearOptions);
  cookieStore.set(NFC_SESSION_EXPIRES_COOKIE, "", clearOptions);
  cookieStore.set(NFC_LAST_LOGIN_AT_COOKIE, "", clearOptions);
  cookieStore.set(NFC_PROFILE_READY_COOKIE, "", clearOptions);
  cookieStore.set(PROFILE_EDIT_MODE_COOKIE, "", clearOptions);
  cookieStore.set(POST_AUTH_RETURN_TO_COOKIE, "", clearOptions);
}
