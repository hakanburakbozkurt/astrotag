"use server";

import { redirect } from "next/navigation";
import { STARTING_STAR_POINTS } from "@/lib/constants/cosmic";
import { HOME_PATH } from "@/lib/nfc/constants";
import { logNfcError } from "@/lib/nfc/error-logger";
import { requireProtectedNfcAccess } from "@/lib/nfc/protected-access.server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { UserData } from "@/types/user";

export type CompleteProfileInput = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  relationshipStatus: string;
};

export async function completeUserProfile(
  input: CompleteProfileInput
): Promise<{ success: true; profile: UserData } | { success: false; error: string }> {
  return withNfcAction("completeUserProfile", async () => {
  let profileId: string;

  try {
    const access = await requireProtectedNfcAccess();
    profileId = access.profileId;
  } catch {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      redirect(HOME_PATH);
    }

    const admin = createServiceRoleClient();
    const { data: profileRow, error: lookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError || !profileRow?.id) {
      redirect(HOME_PATH);
    }

    profileId = profileRow.id;
  }

  const name = input.name.trim();
  const birthPlace = input.birthPlace.trim();

  if (!name || !input.birthDate || !input.birthTime || !birthPlace || !input.relationshipStatus) {
    return { success: false, error: "Tüm profil alanları zorunludur." };
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (error) {
    logNfcError({ layer: "action", handler: "completeUserProfile" }, error);
    return { success: false, error: "Profil kaydedilemedi." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      birth_date: input.birthDate,
      birth_time: input.birthTime,
      birth_place: birthPlace,
      relationship_status: input.relationshipStatus,
    })
    .eq("id", profileId);

  if (error) {
    logNfcError(
      { layer: "action", handler: "completeUserProfile" },
      error,
      { profileId, step: "profiles.update" }
    );
    return { success: false, error: "Profil kaydedilemedi." };
  }

  const { data, error: readError } = await supabase
    .from("profiles")
    .select(
      "name, birth_date, birth_time, birth_place, relationship_status, star_points, star_points_bonus, referral_code, partner_name, partner_birth_date, partner_birth_time, partner_birth_place"
    )
    .eq("id", profileId)
    .maybeSingle();

  if (readError || !data?.name) {
    return { success: false, error: "Profil doğrulanamadı." };
  }

  const profile: UserData = {
    name: data.name,
    birthDate: data.birth_date,
    birthTime: data.birth_time,
    birthPlace: data.birth_place ?? "",
    relationshipStatus: data.relationship_status ?? "İlişki Yok",
    starPoints: data.star_points ?? STARTING_STAR_POINTS,
    starPointsBonus: data.star_points_bonus ?? 0,
    referralCode: data.referral_code,
    partnerName: data.partner_name,
    partnerBirthDate: data.partner_birth_date ?? undefined,
    partnerBirthTime: data.partner_birth_time ?? undefined,
    partnerBirthPlace: data.partner_birth_place ?? undefined,
  };

  return { success: true, profile };
  });
}
