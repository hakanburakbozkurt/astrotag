import "server-only";

import { NFC_CARD_OWNED_BY_OTHER_MESSAGE } from "@/lib/nfc/constants";
import { logNfcErrorAndThrow, toError } from "@/lib/nfc/error-logger";
import { findTrustedDevice } from "@/lib/nfc/trusted-devices.server";
import { throwIfSupabaseError } from "@/lib/nfc/supabase-nfc.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const CLAIM_CTX = { layer: "action" as const, handler: "claimNfcCard" };

export type NfcCardOwnership = {
  nfcId: string;
  profileId: string | null;
  isClaimed: boolean;
  ownerId: string | null;
};

export async function getNfcCardOwnership(
  uniqueId: string
): Promise<NfcCardOwnership | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("nfc_cards")
    .select("id, profile_id, is_active, is_claimed, owner_id")
    .eq("unique_id", uniqueId.trim())
    .maybeSingle();

  if (error || !data?.is_active) {
    return null;
  }

  return {
    nfcId: data.id,
    profileId: data.profile_id ?? null,
    isClaimed: Boolean(data.is_claimed),
    ownerId: data.owner_id ?? null,
  };
}

export async function claimNfcCard(
  nfcCardUuid: string,
  ownerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createSupabaseServiceClient();

  const { data: card, error: fetchError } = await supabase
    .from("nfc_cards")
    .select("is_claimed, owner_id")
    .eq("id", nfcCardUuid)
    .maybeSingle();

  if (fetchError || !card) {
    return { ok: false, error: "Kart bulunamadı." };
  }

  if (card.is_claimed && card.owner_id && card.owner_id !== ownerId) {
    return { ok: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
  }

  const { error: updateError } = await supabase
    .from("nfc_cards")
    .update({ is_claimed: true, owner_id: ownerId })
    .eq("id", nfcCardUuid);

  throwIfSupabaseError(updateError, CLAIM_CTX, "nfc_cards.update.claim", {
    nfcCardUuid,
    ownerId,
  });

  return { ok: true };
}

export async function assertTrustedDeviceForOwner(params: {
  uniqueId: string;
  deviceToken: string;
  ownerId: string;
}): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const row = await findTrustedDevice(params.uniqueId, params.deviceToken);

  if (!row) {
    return { ok: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
  }

  if (row.user_id !== params.ownerId) {
    return { ok: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
  }

  return { ok: true, userId: row.user_id };
}

export function canBindClaimedCard(
  isClaimed: boolean,
  ownerId: string | null,
  authUserId: string
): boolean {
  if (!isClaimed) {
    return true;
  }

  return ownerId === authUserId;
}
