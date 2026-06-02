import "server-only";

import { getNfcSession } from "@/lib/nfc/session.server";
import { throwIfSupabaseError } from "@/lib/nfc/supabase-nfc.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const CTX = { layer: "action" as const, handler: "syncAnonymousProfileToUser" };

/**
 * NFC oturumundaki anonim profili, e-posta OTP sonrası auth.users kaydına bağlar.
 */
export async function syncAnonymousProfileToUser(
  authUserId: string,
  uniqueId?: string
): Promise<{ ok: true; profileId: string | null } | { ok: false; error: string }> {
  const service = createSupabaseServiceClient();
  const session = await getNfcSession();

  let profileId = session?.profileId ?? null;

  if (!profileId && uniqueId?.trim()) {
    const { data: card, error: cardError } = await service
      .from("nfc_cards")
      .select("profile_id")
      .eq("unique_id", uniqueId.trim())
      .maybeSingle();

    throwIfSupabaseError(cardError, CTX, "nfc_cards.select", { uniqueId });

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
