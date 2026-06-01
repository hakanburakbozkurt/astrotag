"use server";

import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function getServerNfcProfileId(): Promise<string | null> {
  return getNfcSessionProfileId();
}
