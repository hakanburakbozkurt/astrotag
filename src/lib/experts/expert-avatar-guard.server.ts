import "server-only";

import {
  EXPERT_AVATAR_REQUIRED_CODE,
  EXPERT_AVATAR_REQUIRED_MESSAGE,
  hasExpertAvatar,
} from "@/lib/experts/expert-avatar-required.shared";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type ExpertAvatarGuardFailure = {
  ok: false;
  error: string;
  code: typeof EXPERT_AVATAR_REQUIRED_CODE;
};

export type ExpertAvatarGuardSuccess = {
  ok: true;
  expertProfileId: string;
  avatarUrl: string;
};

export async function assertExpertHasAvatarByProfileId(
  profileId: string
): Promise<ExpertAvatarGuardSuccess | ExpertAvatarGuardFailure> {
  const admin = createServiceRoleClient();
  const { data: expert, error } = await admin
    .from("expert_profiles")
    .select("id, avatar_url")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !expert?.id) {
    return {
      ok: false,
      error: "Uzman profili bulunamadı.",
      code: EXPERT_AVATAR_REQUIRED_CODE,
    };
  }

  if (!hasExpertAvatar(expert.avatar_url)) {
    return {
      ok: false,
      error: EXPERT_AVATAR_REQUIRED_MESSAGE,
      code: EXPERT_AVATAR_REQUIRED_CODE,
    };
  }

  return {
    ok: true,
    expertProfileId: expert.id,
    avatarUrl: expert.avatar_url!.trim(),
  };
}

export async function assertExpertHasAvatarByExpertProfileId(
  expertProfileId: string
): Promise<ExpertAvatarGuardSuccess | ExpertAvatarGuardFailure> {
  const admin = createServiceRoleClient();
  const { data: expert, error } = await admin
    .from("expert_profiles")
    .select("id, avatar_url")
    .eq("id", expertProfileId)
    .maybeSingle();

  if (error || !expert?.id) {
    return {
      ok: false,
      error: "Uzman profili bulunamadı.",
      code: EXPERT_AVATAR_REQUIRED_CODE,
    };
  }

  if (!hasExpertAvatar(expert.avatar_url)) {
    return {
      ok: false,
      error: EXPERT_AVATAR_REQUIRED_MESSAGE,
      code: EXPERT_AVATAR_REQUIRED_CODE,
    };
  }

  return {
    ok: true,
    expertProfileId: expert.id,
    avatarUrl: expert.avatar_url!.trim(),
  };
}
