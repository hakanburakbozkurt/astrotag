"use server";

import { DASHBOARD_PATH } from "@/lib/nfc/constants";
import {
  isWithinAuthPersistenceWindow,
  readLastLoginAtCookie,
} from "@/lib/nfc/auth-persistence.server";
import { getNfcSession } from "@/lib/nfc/session.server";

/** Uygulama açılışında — 24 saat içinde oturum varsa dashboard'a yönlendir. */
export async function checkAuthPersistenceRedirect(): Promise<string | null> {
  const lastLoginAt = await readLastLoginAtCookie();

  if (!isWithinAuthPersistenceWindow(lastLoginAt)) {
    return null;
  }

  const session = await getNfcSession();
  if (!session) {
    return null;
  }

  return DASHBOARD_PATH;
}
