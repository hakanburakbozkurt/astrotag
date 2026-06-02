"use server";

import { getProtectedNfcAccess } from "@/lib/nfc/protected-access.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function getServerNfcProfileId(): Promise<string | null> {
  const access = await getProtectedNfcAccess();
  return access?.profileId ?? null;
}
