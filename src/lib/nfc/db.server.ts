import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireNfcSessionProfileId } from "@/lib/nfc/session.server";

export async function getAuthenticatedServiceClient() {
  const profileId = await requireNfcSessionProfileId();
  return {
    supabase: createSupabaseServiceClient(),
    profileId,
  };
}
