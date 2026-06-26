"use server";

import {
  clearProfileEditModeCookie,
  setProfileEditModeCookie,
} from "@/lib/nfc/profile-edit-mode.server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export async function enterProfileEditModeAction(): Promise<void> {
  return withNfcAction("enterProfileEditModeAction", async () => {
    await setProfileEditModeCookie();
  });
}

export async function clearProfileEditModeAction(): Promise<void> {
  return withNfcAction("clearProfileEditModeAction", async () => {
    await clearProfileEditModeCookie();
  });
}
