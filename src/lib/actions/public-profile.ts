"use server";

import { getPublicProfileByUniqueId } from "@/lib/nfc/public-profile.server";
import type { PublicNfcProfile } from "@/types/public-profile";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export async function fetchPublicNfcProfileAction(
  uniqueId: string
): Promise<
  | { success: true; profile: PublicNfcProfile }
  | { success: false; error: string }
> {
  return withNfcAction("fetchPublicNfcProfileAction", async () => {
    const result = await getPublicProfileByUniqueId(uniqueId);

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, profile: result.profile };
  });
}
