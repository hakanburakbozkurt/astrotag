"use server";

import { verifyPin } from "@/lib/nfc/nfc-auth-core";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export type PinLoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

/**
 * Doğum tarihi + PIN doğrulama — verifyPin ile oturum açılır.
 */
export async function handlePinLogin(params: {
  uniqueId: string;
  pin: string;
  birthDate: string;
}): Promise<PinLoginResult> {
  return withNfcAction("handlePinLogin", async () => {
    const result = await verifyPin(
      params.uniqueId,
      params.pin,
      params.birthDate
    );

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, redirectTo: result.redirectTo };
  });
}
