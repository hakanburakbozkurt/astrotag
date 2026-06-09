"use server";

import { verifyPin } from "@/lib/nfc/nfc-auth-core";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export type PinLoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

/** PIN doğrulama — başarılı girişte oturum açılır. */
export async function handlePinLogin(params: {
  uniqueId: string;
  pin?: string;
  pin_code?: string;
}): Promise<PinLoginResult> {
  return withNfcAction("handlePinLogin", async () => {
    const pin = params.pin ?? params.pin_code ?? "";
    const result = await verifyPin(params.uniqueId, pin);

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, redirectTo: result.redirectTo };
  });
}
