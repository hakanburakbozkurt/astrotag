import "server-only";

import { DASHBOARD_PATH } from "@/lib/nfc/constants";
import { ensureProfileForAuthUser } from "@/lib/nfc/ensure-profile.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Başarılı auth sonrası hedef — doğum bilgisi kayıtta zorunlu değil */
export async function resolvePostAuthDestination(
  userId: string
): Promise<string> {
  try {
    await ensureProfileForAuthUser(userId);
    return DASHBOARD_PATH;
  } catch {
    return DASHBOARD_PATH;
  }
}

/** @deprecated Profil düzenleme akışı için — kayıt sonrası zorunlu değil */
export async function resolveProfileCompletionRedirect(
  profileId: string
): Promise<string> {
  void profileId;
  return DASHBOARD_PATH;
}
