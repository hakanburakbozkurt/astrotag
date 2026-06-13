"use server";

import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { checkCardPin } from "@/lib/nfc/check-card-pin.server";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import {
  DASHBOARD_PATH,
  INVALID_NFC_CARD_MESSAGE,
  PROFILE_SETUP_PATH,
} from "@/lib/nfc/constants";
import { assertNfcUserDataCardForSession } from "@/lib/nfc/nfc-user-data-card.server";
import { syncProfileNfcUid } from "@/lib/nfc/nfc-profile-link.server";
import { normalizePinInput } from "@/lib/nfc/pin-input";
import { resolveRedirectAfterPinLogin } from "@/lib/nfc/profile-readiness.server";
import { getNfcSession, setNfcSession } from "@/lib/nfc/session.server";
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
 * 3. nfc_sessions oluştur → profile-setup veya /dashboard
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
    } catch {
      return { ok: false, error: INVALID_NFC_CARD_MESSAGE };
    }

    const redirectTo = await resolveRedirectAfterPinLogin(
      admin,
      pinResult.profileId
    );

    const session = await getNfcSession();
    const sessionMatchesCard =
      session?.nfcId === nfcCardUuid &&
      session?.profileId === pinResult.profileId;

    if (
      redirectTo === DASHBOARD_PATH &&
      (!session || !sessionMatchesCard)
    ) {
      return { ok: true, redirectTo: PROFILE_SETUP_PATH };
    }

    return { ok: true, redirectTo };
  });
}
