"use server";

import { verifyPin } from "@/lib/nfc/nfc-auth-core";
import { normalizePinInput } from "@/lib/nfc/pin-input";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export type PinLoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

/**
 * PIN girişi (handlePinLogin):
 * 1. nfc_cards tablosundan unique_id ile kart + profile_id + pin_code oku
 * 2. pin_code ile kullanıcı PIN'ini kod içinde karşılaştır
 * 3. Doğruysa nfc_sessions'a yalnızca nfc_id, profile_id, fingerprint, expires_at insert et
 */
export async function handlePinLogin(params: {
  uniqueId: string;
  pin?: string;
  pin_code?: string;
}): Promise<PinLoginResult> {
  const pin_code = normalizePinInput(params.pin ?? params.pin_code ?? "");

  console.log("[handlePinLogin] tetiklendi", {
    uniqueId: params.uniqueId,
    pinLength: pin_code.length,
    at: new Date().toISOString(),
  });

  return withNfcAction("handlePinLogin", async () => {
    const result = await verifyPin(params.uniqueId, pin_code);

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, redirectTo: result.redirectTo };
  });
}
