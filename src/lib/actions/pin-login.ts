"use server";

import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { verifyPin } from "@/lib/nfc/nfc-auth-core";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import {
  DASHBOARD_PATH,
  HOME_PATH,
  INVALID_NFC_CARD_MESSAGE,
  REGISTRATION_COMPLETE_PATH,
} from "@/lib/nfc/constants";
import { assertNfcUserDataCardForSession } from "@/lib/nfc/nfc-user-data-card.server";
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
 * 1. Gateway — verifyPin; yanlış PIN → /
 * 2. nfc_user_data.id FK doğrulama — geçersizse oturum açılmaz
 * 3. nfc_sessions oluştur → profil kapısı → /kayit-tamamla veya /dashboard
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
      console.log("[handlePinLogin] PIN doğrulama başarısız — ana sayfaya yönlendir", {
        uniqueId,
        error: pinResult.error,
      });
      return { ok: true, redirectTo: HOME_PATH };
    }

    const admin = createServiceRoleClient();

    const cardAssert = await assertNfcUserDataCardForSession(admin, {
      uniqueId,
      nfcCardUuid: pinResult.nfcCardUuid,
    });

    if (!cardAssert.ok) {
      console.error("[handlePinLogin] Oturum açılmadı — nfc_user_data FK hedefi geçersiz", {
        uniqueId,
        pinResultNfcId: pinResult.nfcCardUuid,
        error: cardAssert.error,
      });
      return { ok: false, error: cardAssert.error };
    }

    const nfcCardUuid = cardAssert.card.id;

    try {
      await setNfcSession({
        profileId: pinResult.profileId,
        nfcCardUuid,
      });
      await confirmStorageAccessAction();
      await clearPendingNfcCardCookie();
    } catch (sessionError) {
      console.error("[handlePinLogin] nfc_sessions oluşturulamadı", {
        uniqueId,
        nfcCardUuid,
        profileId: pinResult.profileId,
        error:
          sessionError instanceof Error
            ? sessionError.message
            : String(sessionError),
      });
      return { ok: false, error: INVALID_NFC_CARD_MESSAGE };
    }

    const redirectTo = await resolveRedirectAfterPinLogin(admin, {
      uniqueId,
      nfcCardUuid,
    });

    const session = await getNfcSession();
    const sessionMatchesCard =
      session?.nfcId === nfcCardUuid &&
      session?.profileId === pinResult.profileId;

    console.log("[handlePinLogin] PIN doğru — oturum + profil kapısı", {
      uniqueId,
      nfcCardUuid,
      profileId: pinResult.profileId,
      redirectTo,
      sessionPresent: Boolean(session),
      sessionNfcId: session?.nfcId ?? null,
      sessionProfileId: session?.profileId ?? null,
      sessionMatchesCard,
    });

    if (
      redirectTo === DASHBOARD_PATH &&
      (!session || !sessionMatchesCard)
    ) {
      console.warn(
        "[handlePinLogin] Dashboard yasak — oturum eksik veya kart eşleşmiyor",
        {
          redirectTo,
          sessionPresent: Boolean(session),
          sessionMatchesCard,
        }
      );
      return { ok: true, redirectTo: REGISTRATION_COMPLETE_PATH };
    }

    return { ok: true, redirectTo };
  });
}
