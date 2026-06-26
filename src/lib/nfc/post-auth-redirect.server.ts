import "server-only";

import { DASHBOARD_PATH, PROFILE_COMPLETE_PATH } from "@/lib/nfc/constants";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Başarılı auth sonrası hedef: profil doluysa dashboard, değilse tamamlama */
export async function resolvePostAuthDestination(
  userId: string
): Promise<string> {
  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("profiles")
      .select("name")
      .eq("user_id", userId)
      .maybeSingle();

    return data?.name?.trim() ? DASHBOARD_PATH : PROFILE_COMPLETE_PATH;
  } catch {
    return PROFILE_COMPLETE_PATH;
  }
}
