import "server-only";

import { cookies } from "next/headers";
import { clearAuthPendingCookie } from "@/lib/auth/auth-pending-cookie.server";
import {
  NFC_FINGERPRINT_COOKIE,
  PENDING_NFC_COOKIE,
  STORAGE_VERIFIED_COOKIE,
} from "@/lib/nfc/constants";
import { clearNfcSessionCookieBundle } from "@/lib/nfc/cookie-session.server";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import { getStrictClearCookieOptions } from "@/lib/nfc/device-cookies.server";

/** Supabase + legacy NFC çerezlerini temizle — tam çıkış */
export async function clearAllAuthState(): Promise<void> {
  await clearNfcSessionCookieBundle();
  await clearPendingNfcCardCookie();
  await clearAuthPendingCookie();

  const cookieStore = await cookies();
  const clearOptions = getStrictClearCookieOptions();

  cookieStore.set(STORAGE_VERIFIED_COOKIE, "", clearOptions);
  cookieStore.set(PENDING_NFC_COOKIE, "", clearOptions);
  cookieStore.set(NFC_FINGERPRINT_COOKIE, "", clearOptions);
}
