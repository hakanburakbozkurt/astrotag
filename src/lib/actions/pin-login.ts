"use server";

import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { nfcAuthSuccessAction } from "@/lib/actions/nfc-auth-success";
import { checkCardPin } from "@/lib/nfc/check-card-pin.server";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import {
  INVALID_NFC_CARD_MESSAGE,
} from "@/lib/nfc/constants";
import { assertNfcUserDataCardForSession } from "@/lib/nfc/nfc-user-data-card.server";
import { syncProfileNfcUid } from "@/lib/nfc/nfc-profile-link.server";
import { normalizePinInput } from "@/lib/nfc/pin-input";
import { clearProfileEditModeCookie } from "@/lib/nfc/profile-edit-mode.server";
import { resolvePostPinLoginRedirect } from "@/lib/nfc/post-pin-redirect.server";
import { setNfcSession } from "@/lib/nfc/session.server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

export type PinLoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

/**
 * PIN girişi (handlePinLogin):
 * 1. checkCardPin — pin_code eşleşmezse "Hatalı PIN"
 * 2. nfc_user_data.id FK doğrulama — geçersizse oturum açılmaz
 * 3. nfc_sessions oluştur → kayıtlı hedef veya /dashboard
 */
export async function handlePinLogin(params: {
  uniqueId: string;
  pin?: string;
  pin_code?: string;
}): Promise<PinLoginResult> {
  const pin_code = normalizePinInput(params.pin ?? params.pin_code ?? "");
  const uniqueId = normalizeNfcUniqueId(params.uniqueId);

  return withNfcAction("handlePinLogin", async () => {
    const pinResult = await checkCardPin(uniqueId, pin_code);

    if (!pinResult.ok) {
      return { ok: false, error: pinResult.error };
    }

    const admin = createServiceRoleClient();

    const cardAssert = await assertNfcUserDataCardForSession(admin, {
      uniqueId,
      nfcCardUuid: pinResult.nfcCardUuid,
    });

    if (!cardAssert.ok) {
      return { ok: false, error: cardAssert.error };
    }

    const nfcCardUuid = cardAssert.card.id;

    await syncProfileNfcUid(admin, pinResult.profileId, uniqueId);

    try {
      await setNfcSession({
        profileId: pinResult.profileId,
        nfcCardUuid,
      });
      await confirmStorageAccessAction();
      await clearPendingNfcCardCookie();
      await clearProfileEditModeCookie();
      await nfcAuthSuccessAction(uniqueId);
    } catch {
      return { ok: false, error: INVALID_NFC_CARD_MESSAGE };
    }

    const redirectTo = await resolvePostPinLoginRedirect();

    return { ok: true, redirectTo };
  });
}
