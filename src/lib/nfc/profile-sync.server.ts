import "server-only";

import { getNfcSession } from "@/lib/nfc/session.server";
import { throwIfSupabaseError } from "@/lib/nfc/supabase-nfc.server";
import {
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { createServiceRoleClient } from "@/lib/supabase/service";

const CTX = { layer: "action" as const, handler: "syncAnonymousProfileToUser" };

/**
 * NFC oturumundaki anonim profili, e-posta OTP sonrası auth.users kaydına bağlar.
 */
export async function syncAnonymousProfileToUser(
  authUserId: string,
  uniqueId?: string
): Promise<{ ok: true; profileId: string | null } | { ok: false; error: string }> {
  const service = createServiceRoleClient();
  const session = await getNfcSession();

  let profileId = session?.profileId ?? null;

  if (!profileId && uniqueId?.trim()) {
    const { data: card, error: cardError } = await service
      .from(NFC_CARD_TABLE)
      .select("profile_id")
      .eq(NFC_CARD_SLUG_COLUMN, uniqueId.trim())
      .maybeSingle();

    throwIfSupabaseError(cardError, CTX, "nfc_user_data.select", { uniqueId });

    profileId = card?.profile_id ?? null;
  }

  if (!profileId) {
    return { ok: true, profileId: null };
  }

  const { data: existing, error: fetchError } = await service
    .from("profiles")
    .select("user_id")
    .eq("id", profileId)
    .maybeSingle();

  throwIfSupabaseError(fetchError, CTX, "profiles.select", { profileId });

  if (existing?.user_id && existing.user_id !== authUserId) {
    return { ok: false, error: "Bu profil başka bir hesaba bağlı." };
  }

  const { error: updateError } = await service
    .from("profiles")
    .update({ user_id: authUserId })
    .eq("id", profileId);

  throwIfSupabaseError(updateError, CTX, "profiles.update", {
    profileId,
    authUserId,
  });

  return { ok: true, profileId };
}
