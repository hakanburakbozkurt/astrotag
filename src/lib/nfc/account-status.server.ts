import "server-only";

import { ACCOUNT_SUSPENDED_MESSAGE } from "@/lib/nfc/constants";
import {
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PROFILES_TABLE = "profiles";

export class AccountSuspendedError extends Error {
  constructor(message: string = ACCOUNT_SUSPENDED_MESSAGE) {
    super(message);
    this.name = "AccountSuspendedError";
  }
}

export type AccountLoginGateInput = {
  profileId: string;
  uniqueId?: string;
  nfcCardUuid?: string;
};

/** PIN / NFC enter öncesi — hesap veya kart pasifse reddeder */
export async function assertAccountLoginAllowed(
  input: AccountLoginGateInput
): Promise<void> {
  const allowed = await isAccountLoginAllowed(input);
  if (!allowed) {
    throw new AccountSuspendedError();
  }
}

export async function isAccountLoginAllowed(
  input: AccountLoginGateInput
): Promise<boolean> {
  const profileId = input.profileId.trim();
  if (!profileId) {
    return false;
  }

  const supabase = createServiceRoleClient();

  const { data: profile, error: profileError } = await supabase
    .from(PROFILES_TABLE)
    .select("is_active")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError || !profile || profile.is_active === false) {
    return false;
  }

  if (input.nfcCardUuid?.trim()) {
    const { data: card, error: cardError } = await supabase
      .from(NFC_CARD_TABLE)
      .select("is_active, profile_id")
      .eq("id", input.nfcCardUuid.trim())
      .maybeSingle();

    if (
      cardError ||
      !card ||
      card.is_active === false ||
      (card.profile_id && card.profile_id !== profileId)
    ) {
      return false;
    }
  }

  const slug = input.uniqueId ? normalizeNfcUniqueId(input.uniqueId) : "";
  if (slug) {
    const { data: card, error: cardError } = await supabase
      .from(NFC_CARD_TABLE)
      .select("is_active, profile_id")
      .eq(NFC_CARD_SLUG_COLUMN, slug)
      .maybeSingle();

    if (
      cardError ||
      !card ||
      card.is_active === false ||
      (card.profile_id && card.profile_id !== profileId)
    ) {
      return false;
    }
  }

  return true;
}
