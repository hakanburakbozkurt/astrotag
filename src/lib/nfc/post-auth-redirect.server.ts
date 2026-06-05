import "server-only";

import { createClient } from "@supabase/supabase-js";
import { DASHBOARD_PATH, PROFILE_COMPLETE_PATH } from "@/lib/nfc/constants";

/** Başarılı auth sonrası hedef: profil doluysa dashboard, değilse tamamlama */
export async function resolvePostAuthDestination(
  userId: string
): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return PROFILE_COMPLETE_PATH;
  }

  const service = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await service
    .from("profiles")
    .select("name")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.name?.trim() ? DASHBOARD_PATH : PROFILE_COMPLETE_PATH;
}
