import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireProtectedNfcAccess } from "@/lib/nfc/protected-access.server";

export async function getAuthenticatedServiceClient() {
  const access = await requireProtectedNfcAccess();
  return {
    supabase: createSupabaseServiceClient(),
    profileId: access.profileId,
    authUserId: access.authUserId,
    uniqueId: access.uniqueId,
  };
}
