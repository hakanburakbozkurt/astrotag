"use server";

import { randomUUID } from "crypto";
import {
  USER_AVATAR_MAX_BYTES,
  USER_AVATARS_BUCKET,
  isUserAvatarMimeType,
} from "@/lib/storage/profile-avatars.shared";
import { requireAuthUserId } from "@/lib/supabase-actions";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { fetchExpertProfileByProfileId } from "@/lib/supabase/profile-query.server";
import { hasExpertAvatar } from "@/lib/experts/expert-avatar-required.shared";

export type PersonalAvatarData = {
  displayName: string;
  isExpert: boolean;
  userAvatarUrl: string | null;
  expertAvatarUrl: string | null;
  hasExpertAvatar: boolean;
};

export async function getPersonalAvatarDataAction(): Promise<PersonalAvatarData | null> {
  try {
    const profileId = await requireAuthUserId();
    const admin = createServiceRoleClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("name, user_role, avatar_url")
      .eq("id", profileId)
      .maybeSingle();

    if (!profile) {
      return null;
    }

    const isExpert = profile.user_role === "expert";
    let expertAvatarUrl: string | null = null;

    if (isExpert) {
      const { data: expert } = await fetchExpertProfileByProfileId<{
        avatar_url: string | null;
      }>(admin, profileId, "avatar_url");

      expertAvatarUrl = expert?.avatar_url ?? null;
    }

    return {
      displayName: profile.name?.trim() || "Gezgin",
      isExpert,
      userAvatarUrl: profile.avatar_url,
      expertAvatarUrl,
      hasExpertAvatar: hasExpertAvatar(expertAvatarUrl),
    };
  } catch {
    return null;
  }
}

export async function uploadUserProfileAvatarAction(
  formData: FormData
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  try {
    const profileId = await requireAuthUserId();

    const file = formData.get("avatar");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Geçerli bir görsel seçin." };
    }

    if (file.size > USER_AVATAR_MAX_BYTES) {
      return { ok: false, error: "Görsel en fazla 5 MB olabilir." };
    }

    if (!isUserAvatarMimeType(file.type)) {
      return { ok: false, error: "Yalnızca JPEG, PNG veya WebP yükleyebilirsiniz." };
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";

    const objectPath = `${profileId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const admin = createServiceRoleClient();

    const { error: uploadError } = await admin.storage
      .from(USER_AVATARS_BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { ok: false, error: "Profil fotoğrafı yüklenemedi." };
    }

    const { data: publicUrlData } = admin.storage
      .from(USER_AVATARS_BUCKET)
      .getPublicUrl(objectPath);

    const avatarUrl = publicUrlData.publicUrl;

    const { error: updateError } = await admin
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", profileId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true, avatarUrl };
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}
