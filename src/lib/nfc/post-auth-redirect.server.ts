import "server-only";

import {
  DASHBOARD_PATH,
  PROFILE_SETUP_PATH,
} from "@/lib/nfc/constants";
import {
  isProfileSetupComplete,
  type ProfileSetupFields,
} from "@/lib/nfc/profile-readiness.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PROFILE_SETUP_SELECT =
  "name, birth_date, birth_time, birth_city, birth_district, is_profile_complete" as const;

type ProfileSetupRow = ProfileSetupFields & {
  is_profile_complete?: boolean | null;
};

function profileNeedsSetup(profile: ProfileSetupRow | null): boolean {
  if (!profile) {
    return true;
  }

  if (profile.is_profile_complete === true) {
    return false;
  }

  return !isProfileSetupComplete(profile);
}

/** Profil tamamsa dashboard, değilse kurulum ekranı */
export async function resolveProfileCompletionRedirect(
  profileId: string
): Promise<string> {
  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("profiles")
      .select(PROFILE_SETUP_SELECT)
      .eq("id", profileId)
      .maybeSingle();

    return profileNeedsSetup(data) ? PROFILE_SETUP_PATH : DASHBOARD_PATH;
  } catch {
    return PROFILE_SETUP_PATH;
  }
}

/** Başarılı auth sonrası hedef — auth.users.id ile */
export async function resolvePostAuthDestination(
  userId: string
): Promise<string> {
  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data?.id) {
      return PROFILE_SETUP_PATH;
    }

    return resolveProfileCompletionRedirect(data.id);
  } catch {
    return PROFILE_SETUP_PATH;
  }
}
