import "server-only";

import { pairNfcCardAndCreateSession } from "@/lib/actions/nfc-auth-core";
import { clearAuthPendingCookie } from "@/lib/auth/auth-pending-cookie.server";
import { ensureProfileForAuthUser } from "@/lib/nfc/ensure-profile.server";
import { logNfcDebug } from "@/lib/nfc/nfc-debug.server";

export type NfcAuthDeviceContext = {
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
};

export type NfcCardReady = {
  nfcId: string;
  profileId: string | null;
  isClaimed: boolean;
  ownerId: string | null;
};

/**
 * Şifre ile auth tamamlandıktan sonra profil + NFC kart eşlemesi ve oturum.
 */
export async function finishNfcPasswordAuth(params: {
  uniqueId: string;
  userId: string;
  card: NfcCardReady;
  device: NfcAuthDeviceContext;
}): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: string }
> {
  logNfcDebug("finishNfcPasswordAuth started", {
    userId: params.userId,
    uniqueId: params.uniqueId,
  });

  const { profileId: ensuredProfileId } = await ensureProfileForAuthUser(
    params.userId,
    params.uniqueId
  );

  logNfcDebug("finishNfcPasswordAuth profile ready", {
    profileId: ensuredProfileId,
  });

  const paired = await pairNfcCardAndCreateSession({
    uniqueId: params.uniqueId,
    userId: params.userId,
    nfcCardUuid: params.card.nfcId,
    profileId: params.card.profileId ?? ensuredProfileId,
    device: params.device,
  });

  if (!paired.success) {
    logNfcDebug("finishNfcPasswordAuth pairing failed", { error: paired.error });
    return { success: false, error: paired.error };
  }

  await clearAuthPendingCookie();
  logNfcDebug("finishNfcPasswordAuth success", { redirectTo: paired.redirectTo });
  return { success: true, redirectTo: paired.redirectTo };
}
