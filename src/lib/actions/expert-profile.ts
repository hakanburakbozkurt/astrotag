"use server";

import { randomUUID } from "crypto";
import {
  EXPERT_AVATARS_BUCKET,
  EXPERT_AVATAR_MAX_BYTES,
  isExpertAvatarMimeType,
} from "@/lib/storage/expert-avatars.shared";
import { requireAuthUserId } from "@/lib/supabase-actions";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { fetchExpertProfileByProfileId } from "@/lib/supabase/profile-query.server";
import { normalizeWhatsAppAdminNumber } from "@/lib/support/whatsapp-recovery.config";

const AVATAR_BUCKET = EXPERT_AVATARS_BUCKET;
const MAX_AVATAR_BYTES = EXPERT_AVATAR_MAX_BYTES;

export type ExpertProfileEditData = {
  expertProfileId: string;
  avatarUrl: string | null;
  about: string;
  experienceText: string;
  phoneNumber: string;
  hasPhoneNumber: boolean;
};

export type ExpertProfileEditResult =
  | { ok: true }
  | { ok: false; error: string };

async function requireExpertProfile(profileId: string) {
  const admin = createServiceRoleClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("user_role")
    .eq("id", profileId)
    .maybeSingle();

  if (profile?.user_role !== "expert") {
    return { ok: false as const, error: "Bu işlem yalnızca uzman hesapları içindir." };
  }

  const { data: expert, error } = await fetchExpertProfileByProfileId<{
    id: string;
    avatar_url: string | null;
    about: string | null;
    about_text: string | null;
    experience_text: string | null;
    phone_number: string | null;
  }>(
    admin,
    profileId,
    "id, avatar_url, about, about_text, experience_text, phone_number"
  );

  if (error || !expert?.id) {
    return { ok: false as const, error: "Uzman profili bulunamadı." };
  }

  return { ok: true as const, expert };
}

export async function getExpertProfileEditDataAction(): Promise<
  ExpertProfileEditData | null
> {
  try {
    const profileId = await requireAuthUserId();
    const loaded = await requireExpertProfile(profileId);

    if (!loaded.ok) {
      return null;
    }

    const expert = loaded.expert;
    const about =
      expert.about?.trim() ||
      expert.about_text?.trim() ||
      "";

    return {
      expertProfileId: expert.id,
      avatarUrl: expert.avatar_url,
      about,
      experienceText: expert.experience_text?.trim() ?? "",
      phoneNumber: expert.phone_number?.trim() ?? "",
      hasPhoneNumber: Boolean(expert.phone_number?.trim()),
    };
  } catch {
    return null;
  }
}

export async function saveExpertProfileFieldsAction(input: {
  about: string;
  experienceText: string;
  phoneNumber: string;
}): Promise<ExpertProfileEditResult> {
  try {
    const profileId = await requireAuthUserId();
    const loaded = await requireExpertProfile(profileId);

    if (!loaded.ok) {
      return loaded;
    }

    const phone = normalizeWhatsAppAdminNumber(input.phoneNumber.trim());
    if (!phone || phone.length < 10) {
      return {
        ok: false,
        error: "Geçerli bir telefon numarası girin (WhatsApp bildirimleri için zorunlu).",
      };
    }

    const about = input.about.trim();
    const experienceText = input.experienceText.trim();

    const admin = createServiceRoleClient();
    const { error } = await admin
      .from("expert_profiles")
      .update({
        about,
        about_text: about,
        experience_text: experienceText,
        phone_number: phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loaded.expert.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}

export async function uploadExpertAvatarAction(
  formData: FormData
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  try {
    const profileId = await requireAuthUserId();
    const loaded = await requireExpertProfile(profileId);

    if (!loaded.ok) {
      return loaded;
    }

    const file = formData.get("avatar");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Geçerli bir görsel seçin." };
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return { ok: false, error: "Görsel en fazla 5 MB olabilir." };
    }

    if (!isExpertAvatarMimeType(file.type)) {
      return { ok: false, error: "Yalnızca JPEG, PNG veya WebP yükleyebilirsiniz." };
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";

    const objectPath = `${loaded.expert.id}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const admin = createServiceRoleClient();
    const { error: uploadError } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { ok: false, error: "Avatar yüklenemedi." };
    }

    const { data: publicUrlData } = admin.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(objectPath);

    const avatarUrl = publicUrlData.publicUrl;

    const { error: updateError } = await admin
      .from("expert_profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loaded.expert.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true, avatarUrl };
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}
