"use server";

import {
  requestPasswordResetEmail,
  updateAuthenticatedPassword,
} from "@/lib/auth/auth-service.server";
import type { AuthActionResult } from "@/lib/auth/auth-service.types";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export async function requestPasswordResetAction(
  email: string
): Promise<AuthActionResult> {
  return withNfcAction("requestPasswordResetAction", async () => {
    return requestPasswordResetEmail(email);
  });
}

export async function updatePasswordAction(
  newPassword: string
): Promise<AuthActionResult> {
  return withNfcAction("updatePasswordAction", async () => {
    return updateAuthenticatedPassword(newPassword);
  });
}
