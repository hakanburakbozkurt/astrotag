"use server";

/**
 * @deprecated Yeni akış: nfc-email-auth.ts — geriye dönük export'lar.
 */
export {
  checkNfcAutoLoginAction,
  startNfcEmailAuthAction,
  verifyNfcOtpAndEnterAction,
  resendNfcOtpAction,
} from "@/lib/actions/nfc-email-auth";

export { signOutNfcAction } from "@/lib/actions/nfc-auth-signout";

import { NFC_CARD_INACTIVE_MESSAGE } from "@/lib/nfc/constants";
import { publicProfilePathForUniqueId } from "@/lib/nfc/card-paths";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import { validateNfcCardActive } from "@/lib/nfc/session.server";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export type NfcEntryResolveResult =
  | { status: "public_profile"; redirectTo: string }
  | { status: "error"; error: string };

/** Herkese açık profil rotası (/p/id) — NFC girişi /c/id auth kullanır */
export async function resolveNfcEntryAction(
  uniqueId: string
): Promise<NfcEntryResolveResult> {
  return withNfcAction("resolveNfcEntryAction", async () => {
    logNfcEvent(
      "info",
      { layer: "action", handler: "resolveNfcEntryAction" },
      "Public profil yönlendirmesi",
      { uniqueId }
    );

    const card = await validateNfcCardActive(uniqueId);
    if (!card.ok) {
      return { status: "error", error: NFC_CARD_INACTIVE_MESSAGE };
    }

    await clearPendingNfcCardCookie();

    return {
      status: "public_profile",
      redirectTo: publicProfilePathForUniqueId(uniqueId),
    };
  });
}
