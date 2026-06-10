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
  console.log("--- [DEBUG] handlePinLogin SERVER ACTION TETIKLENDI ---", {
    uniqueId: params.uniqueId,
    hasPin: Boolean(params.pin ?? params.pin_code),
    pinLength: (params.pin ?? params.pin_code ?? "").length,
    at: new Date().toISOString(),
  });

  return withNfcAction("handlePinLogin", async () => {
    console.log("--- [DEBUG] handlePinLogin withNfcAction icinde ---");

    const pin = params.pin ?? params.pin_code ?? "";
    const result = await verifyPin(params.uniqueId, pin);

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, redirectTo: result.redirectTo };
  });
}
