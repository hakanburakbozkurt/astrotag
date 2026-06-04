import "server-only";

import { pairNfcCardAndCreateSession } from "@/lib/actions/nfc-auth-core";
import { clearAuthPendingCookie } from "@/lib/auth/auth-pending-cookie.server";
import { ensureProfileForAuthUser } from "@/lib/nfc/ensure-profile.server";

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
  const { profileId: ensuredProfileId } = await ensureProfileForAuthUser(
    params.userId,
    params.uniqueId
  );

  const paired = await pairNfcCardAndCreateSession({
    uniqueId: params.uniqueId,
    userId: params.userId,
    nfcCardUuid: params.card.nfcId,
    profileId: params.card.profileId ?? ensuredProfileId,
    device: params.device,
  });

  if (!paired.success) {
    return { success: false, error: paired.error };
  }

  await clearAuthPendingCookie();
  return { success: true, redirectTo: paired.redirectTo };
}
