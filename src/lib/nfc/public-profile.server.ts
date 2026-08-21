import "server-only";

import { NFC_CARD_INACTIVE_MESSAGE } from "@/lib/nfc/constants";
import {
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { PublicNfcProfile } from "@/types/public-profile";

export type { PublicNfcProfile };

export async function getPublicProfileByUniqueId(
  uniqueId: string
): Promise<
  | { ok: true; profile: PublicNfcProfile }
  | { ok: false; error: string }
> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select(
      `
      nfc_id,
      is_active,
      owner_id,
      profiles (
        name
      )
    `
    )
    .eq(NFC_CARD_SLUG_COLUMN, uniqueId.trim())
    .maybeSingle();

  if (error || !data?.is_active) {
    return { ok: false, error: NFC_CARD_INACTIVE_MESSAGE };
  }

  const row = data.profiles as
    | { name: string | null }
    | { name: string | null }[]
    | null;

  const profile = Array.isArray(row) ? row[0] : row;
  const displayName = profile?.name?.trim() || "AstroTag Profili";

  return {
    ok: true,
    profile: {
      uniqueId: data.nfc_id,
      name: displayName,
      hasOwner: Boolean(data.owner_id),
    },
  };
}
