import "server-only";

import { NFC_CARD_INACTIVE_MESSAGE } from "@/lib/nfc/constants";
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
    .from("nfc_cards")
    .select(
      `
      unique_id,
      is_active,
      owner_id,
      profiles (
        name,
        birth_date,
        birth_time,
        birth_place,
        relationship_status,
        cosmic_energy
      )
    `
    )
    .eq("unique_id", uniqueId.trim())
    .maybeSingle();

  if (error || !data?.is_active) {
    return { ok: false, error: NFC_CARD_INACTIVE_MESSAGE };
  }

  const row = data.profiles as
    | {
        name: string | null;
        birth_date: string | null;
        birth_time: string | null;
        birth_place: string | null;
        relationship_status: string | null;
        cosmic_energy: number | null;
      }
    | {
        name: string | null;
        birth_date: string | null;
        birth_time: string | null;
        birth_place: string | null;
        relationship_status: string | null;
        cosmic_energy: number | null;
      }[]
    | null;

  const profile = Array.isArray(row) ? row[0] : row;
  const displayName = profile?.name?.trim() || "AstroTag Profili";

  return {
    ok: true,
    profile: {
      uniqueId: data.unique_id,
      name: displayName,
      birthDate: profile?.birth_date ?? null,
      birthTime: profile?.birth_time ?? null,
      birthPlace: profile?.birth_place ?? null,
      relationshipStatus: profile?.relationship_status ?? null,
      cosmicEnergy: profile?.cosmic_energy ?? 0,
      hasOwner: Boolean(data.owner_id),
    },
  };
}
