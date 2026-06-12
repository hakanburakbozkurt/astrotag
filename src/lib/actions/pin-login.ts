"use server";

import { verifyPin } from "@/lib/nfc/nfc-auth-core";
import { normalizePinInput } from "@/lib/nfc/pin-input";
import { resolveRedirectAfterPinLogin } from "@/lib/nfc/profile-readiness.server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

export type PinLoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

/**
 * PIN girişi (handlePinLogin):
 * 1. nfc_cards — PIN doğrula + oturum aç (verifyPin)
 * 2. nfc_user_data.full_name + birth_date — yönlendirme kararı
 */
export async function handlePinLogin(params: {
  uniqueId: string;
  pin?: string;
  pin_code?: string;
}): Promise<PinLoginResult> {
  const pin_code = normalizePinInput(params.pin ?? params.pin_code ?? "");
  const uniqueId = normalizeNfcUniqueId(params.uniqueId);

  console.log("[handlePinLogin] tetiklendi", {
    uniqueId,
    pinLength: pin_code.length,
    at: new Date().toISOString(),
  });

  return withNfcAction("handlePinLogin", async () => {
    const result = await verifyPin(uniqueId, pin_code);

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    const admin = createServiceRoleClient();
    const redirectTo = await resolveRedirectAfterPinLogin(admin, uniqueId);

    console.log("[handlePinLogin] nfc_user_data profil kontrolü", {
      uniqueId,
      redirectTo,
    });

    return { success: true, redirectTo };
  });
}
