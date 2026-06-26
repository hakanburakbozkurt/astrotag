import "server-only";

import { NFC_CARD_OWNED_BY_OTHER_MESSAGE } from "@/lib/nfc/constants";
import { logNfcError, logNfcErrorAndThrow, toError } from "@/lib/nfc/error-logger";
import {
  NFC_CARD_OWNERSHIP_SELECT,
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
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
    .from(NFC_CARD_TABLE)
    .select(NFC_CARD_OWNERSHIP_SELECT)
    .eq(NFC_CARD_SLUG_COLUMN, uniqueId.trim())
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
  let supabase;
  try {
    supabase = createSupabaseServiceClient();
  } catch (error) {
    logNfcError(CLAIM_CTX, error, { nfcCardUuid, step: "service_client" });
    return { ok: false, error: "Sunucu yapılandırması eksik." };
  }

  const { data: card, error: fetchError } = await supabase
    .from(NFC_CARD_TABLE)
    .select("is_claimed, owner_id")
    .eq("id", nfcCardUuid)
    .maybeSingle();

  throwIfSupabaseError(fetchError, CLAIM_CTX, "nfc_user_data.select", {
    nfcCardUuid,
  });

  if (!card) {
    logNfcErrorAndThrow(
      CLAIM_CTX,
      toError("Kart bulunamadı."),
      { nfcCardUuid }
    );
  }

  if (card.is_claimed && card.owner_id && card.owner_id !== ownerId) {
    return { ok: false, error: NFC_CARD_OWNED_BY_OTHER_MESSAGE };
  }

  const { error: updateError } = await supabase
    .from(NFC_CARD_TABLE)
    .update({ is_claimed: true, owner_id: ownerId })
    .eq("id", nfcCardUuid);

  throwIfSupabaseError(updateError, CLAIM_CTX, "nfc_user_data.update.claim", {
    nfcCardUuid,
    ownerId,
  });

  return { ok: true };
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
