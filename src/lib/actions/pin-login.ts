"use server";

import { verifyPin } from "@/lib/nfc/nfc-auth-core";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export type PinLoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

/**
 * Doğum tarihi doğrulama — verifyPin ile oturum açılır (PIN geçici olarak kapalı).
 */
export async function handlePinLogin(params: {
  uniqueId: string;
  birthDate: string;
  pin?: string;
}): Promise<PinLoginResult> {
  return withNfcAction("handlePinLogin", async () => {
    const result = await verifyPin(
      params.uniqueId,
      params.pin ?? "",
      params.birthDate
    );

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, redirectTo: result.redirectTo };
  });
}
