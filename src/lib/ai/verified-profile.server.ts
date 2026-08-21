import "server-only";

import { getServerUserProfile } from "@/lib/tarot/tarot-profile-server";
import { requireAuthUserId } from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { hasPartnerData, type UserData } from "@/types/user";

export type VerifiedProfileSubject = "self" | "partner";

function assertCompleteBirthProfile(profile: UserData, label: string): void {
  if (
    !profile.name?.trim() ||
    !profile.birthDate?.trim() ||
    !profile.birthTime?.trim() ||
    !profile.birthPlace?.trim()
  ) {
    throw new SupabaseActionError(`${label} doğum bilgileri eksik. Profilinizi tamamlayın.`);
  }
}

export function resolveVerifiedSubjectProfile(
  profile: UserData,
  subject: VerifiedProfileSubject = "self"
): UserData {
  if (subject === "partner") {
    if (!hasPartnerData(profile)) {
      throw new SupabaseActionError(
        "Partner doğum bilgileri profilinizde kayıtlı değil."
      );
    }

    return {
      name: profile.partnerName!.trim(),
      birthDate: profile.partnerBirthDate!,
      birthTime: profile.partnerBirthTime!,
      birthPlace: profile.partnerBirthPlace!,
      relationshipStatus: profile.relationshipStatus,
      starPoints: profile.starPoints,
      starPointsBonus: profile.starPointsBonus,
    };
  }

  assertCompleteBirthProfile(profile, "Kayıtlı");
  return profile;
}

export async function loadVerifiedUserProfileForAi(
  profileId: string
): Promise<UserData> {
  const profile = await getServerUserProfile(profileId);
  if (!profile) {
    throw new SupabaseActionError("Kullanıcı profili alınamadı.");
  }

  assertCompleteBirthProfile(profile, "Kayıtlı");
  return profile;
}

export async function loadVerifiedSynastryProfileForAi(
  profileId: string
): Promise<UserData> {
  const profile = await getServerUserProfile(profileId);
  if (!profile) {
    throw new SupabaseActionError("Kullanıcı profili alınamadı.");
  }

  assertCompleteBirthProfile(profile, "Kayıtlı");

  if (!hasPartnerData(profile)) {
    throw new SupabaseActionError(
      "Partner doğum bilgileri profilinizde kayıtlı değil."
    );
  }

  return profile;
}

export async function requireVerifiedSynastryProfile(): Promise<{
  profileId: string;
  profile: UserData;
}> {
  const profileId = await requireAuthUserId();
  const profile = await loadVerifiedSynastryProfileForAi(profileId);
  return { profileId, profile };
}

export async function requireVerifiedUserProfileForAi(
  subject: VerifiedProfileSubject = "self"
): Promise<{ profileId: string; profile: UserData }> {
  const profileId = await requireAuthUserId();
  const ownerProfile = await getServerUserProfile(profileId);

  if (!ownerProfile) {
    throw new SupabaseActionError("Kullanıcı profili alınamadı.");
  }

  const profile = resolveVerifiedSubjectProfile(ownerProfile, subject);
  return { profileId, profile };
}
