import "server-only";

import { cookies } from "next/headers";
import {
  NFC_CARD_COOKIE,
  NFC_LAST_LOGIN_AT_COOKIE,
  NFC_PROFILE_COOKIE,
  NFC_PROFILE_READY_COOKIE,
  NFC_SESSION_COOKIE,
  NFC_SESSION_EXPIRES_COOKIE,
  POST_AUTH_RETURN_TO_COOKIE,
  PROFILE_EDIT_MODE_COOKIE,
} from "@/lib/nfc/constants";
import {
  getStrictClearCookieOptions,
} from "@/lib/nfc/device-cookies.server";

/** Legacy NFC oturum çerezlerini temizle (çıkış / migration) */
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
