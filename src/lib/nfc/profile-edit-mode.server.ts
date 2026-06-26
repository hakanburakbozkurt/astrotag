import "server-only";

import { cookies } from "next/headers";
import { PROFILE_EDIT_MODE_COOKIE } from "@/lib/nfc/constants";
import { readProfileEditModeFromCookie } from "@/lib/nfc/profile-edit-mode.shared";
import {
  getStrictClearCookieOptions,
  getStrictCookieOptions,
} from "@/lib/nfc/device-cookies.server";

export async function isProfileEditModeActive(): Promise<boolean> {
  const cookieStore = await cookies();
  return readProfileEditModeFromCookie(cookieStore);
}

export async function setProfileEditModeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PROFILE_EDIT_MODE_COOKIE, "1", getStrictCookieOptions());
}

export async function clearProfileEditModeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PROFILE_EDIT_MODE_COOKIE, "", getStrictClearCookieOptions());
}
