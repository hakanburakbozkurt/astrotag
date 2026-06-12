"use server";

import { verifyPin } from "@/lib/nfc/nfc-auth-core";
import { HOME_PATH } from "@/lib/nfc/constants";
import { normalizePinInput } from "@/lib/nfc/pin-input";
import { resolveRedirectAfterPinLogin } from "@/lib/nfc/profile-readiness.server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

/** PIN girişi — her zaman redirectTo döner (gateway + iç kapı) */
export type PinLoginResult = { redirectTo: string };

/**
 * PIN girişi (handlePinLogin):
 * 1. Gateway — verifyPin; yanlış PIN → / (içeri alma)
 * 2. İç kapı — nfc_user_data full_name + birth_date → /kayit-tamamla veya /dashboard
 */
export async function handlePinLogin(params: {
  uniqueId: string;
  pin?: string;
  pin_code?: string;
}): Promise<PinLoginResult> {
  const pin_code = normalizePinInput(params.pin ?? params.pin_code ?? "");
  const uniqueId = normalizeNfcUniqueId(params.uniqueId);

  return withNfcAction("handlePinLogin", async () => {
    const pinResult = await verifyPin(uniqueId, pin_code);

    if (!pinResult.ok) {
      console.log("[handlePinLogin] PIN yanlış — ana sayfaya yönlendir", {
        uniqueId,
      });
      return { redirectTo: HOME_PATH };
    }

    const admin = createServiceRoleClient();
    const redirectTo = await resolveRedirectAfterPinLogin(admin, uniqueId);

    console.log("[handlePinLogin] PIN doğru — profil kapısı", {
      uniqueId,
      redirectTo,
    });

    return { redirectTo };
  });
}
