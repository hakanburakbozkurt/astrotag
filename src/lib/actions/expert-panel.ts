"use server";

import { randomUUID } from "crypto";
import {
  EXPERT_APPROVAL_APPROVED,
  EXPERT_APPROVAL_PENDING,
  type ExpertApprovalStatus,
} from "@/lib/expert/expert-approval.shared";
import {
  EXPERT_AVATARS_BUCKET,
  EXPERT_AVATAR_MAX_BYTES,
  isExpertAvatarMimeType,
} from "@/lib/storage/expert-avatars.shared";
import { requireAuthUserId } from "@/lib/supabase-actions";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  fetchExpertProfileByProfileId,
  firstRow,
} from "@/lib/supabase/profile-query.server";

type ExpertProfileRow = {
  id: string;
  display_name: string;
  title: string;
  tradition: string;
  experience_years: number;
  about_text: string;
  philosophy_text: string;
  is_published: boolean;
  earnings_balance_try: number;
  approval_status: string | null;
};

export type ExpertPanelData = {
  expertProfileId: string | null;
  isExpert: boolean;
  approvalStatus: ExpertApprovalStatus | null;
  displayName: string;
  title: string;
  tradition: string;
  experienceYears: number;
  aboutText: string;
  philosophyText: string;
  isPublished: boolean;
  earningsBalanceTry: number;
  services: Array<{
    id: string;
    name: string;
    description: string;
    crystalPrice: number;
    durationMinutes: number;
    isActive: boolean;
    imageUrl: string | null;
  }>;
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    isPublished: boolean;
  }>;
};

async function loadExpertRow(profileId: string) {
  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("user_role, name")
    .eq("id", profileId)
    .maybeSingle();

  if (profile?.user_role !== "expert") {
    return null;
  }

  let { data: expert } = await fetchExpertProfileByProfileId<ExpertProfileRow>(
    admin,
    profileId,
    "*"
  );

  if (!expert) {
    const { data: createdRows, error: insertError } = await admin
      .from("expert_profiles")
      .insert({
        profile_id: profileId,
        display_name: profile?.name?.trim() || "Uzman",
        title: "Kozmik Rehber",
        tradition: "Tarot",
        approval_status: EXPERT_APPROVAL_PENDING,
        is_published: false,
      })
      .select("*")
      .limit(1);

    if (insertError) {
      return null;
    }

    expert = firstRow(createdRows as ExpertProfileRow[] | null);
  }

  return expert;
}

export async function getExpertPanelDataAction(): Promise<ExpertPanelData | null> {
  const profileId = await requireAuthUserId();
  const admin = createServiceRoleClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("user_role, name")
    .eq("id", profileId)
    .maybeSingle();

  if (profile?.user_role !== "expert") {
    return {
      expertProfileId: null,
      isExpert: false,
      approvalStatus: null,
      displayName: profile?.name ?? "",
      title: "",
      tradition: "",
      experienceYears: 0,
      aboutText: "",
      philosophyText: "",
      isPublished: false,
      earningsBalanceTry: 0,
      services: [],
      articles: [],
    };
  }

  const expert = await loadExpertRow(profileId);
  if (!expert) {
    return null;
  }

  const approvalStatus = (expert.approval_status ??
    EXPERT_APPROVAL_PENDING) as ExpertApprovalStatus;

  const [{ data: services }, { data: articles }] = await Promise.all([
    admin
      .from("expert_services")
      .select("*")
      .eq("expert_profile_id", expert.id)
      .order("sort_order"),
    admin
      .from("expert_articles")
      .select("*")
      .eq("expert_profile_id", expert.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    expertProfileId: expert.id,
    isExpert: true,
    approvalStatus,
    displayName: expert.display_name,
    title: expert.title,
    tradition: expert.tradition,
    experienceYears: expert.experience_years,
    aboutText: expert.about_text,
    philosophyText: expert.philosophy_text,
    isPublished: expert.is_published,
    earningsBalanceTry: Number(expert.earnings_balance_try ?? 0),
    services: (services ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      crystalPrice: s.crystal_price,
      durationMinutes: s.duration_minutes,
      isActive: s.is_active,
      imageUrl: s.image_url ?? null,
    })),
    articles: (articles ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      body: a.body,
      isPublished: a.is_published,
    })),
  };
}

export async function getExpertMenuAccessAction(): Promise<{
  showExpertServices: boolean;
}> {
  try {
    const panel = await getExpertPanelDataAction();
    return {
      showExpertServices: Boolean(
        panel?.isExpert && panel.approvalStatus === EXPERT_APPROVAL_APPROVED
      ),
    };
  } catch {
    return { showExpertServices: false };
  }
}

async function requireApprovedExpert(profileId: string) {
  const expert = await loadExpertRow(profileId);
  if (!expert?.id) {
    return { ok: false as const, error: "Uzman profili bulunamadı." };
  }

  const approvalStatus = (expert.approval_status ??
    EXPERT_APPROVAL_PENDING) as ExpertApprovalStatus;

  if (approvalStatus !== EXPERT_APPROVAL_APPROVED) {
    return {
      ok: false as const,
      error: "Bu işlem için admin onayı gereklidir.",
    };
  }

  return { ok: true as const, expertId: expert.id, approvalStatus };
}

export async function saveExpertProfileAction(input: {
  displayName: string;
  title: string;
  tradition: string;
  experienceYears: number;
  aboutText: string;
  philosophyText: string;
  isPublished: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const profileId = await requireAuthUserId();
  const admin = createServiceRoleClient();
  const expert = await loadExpertRow(profileId);

  if (!expert?.id) {
    return { ok: false, error: "Uzman profili bulunamadı." };
  }

  const approvalStatus = (expert.approval_status ??
    EXPERT_APPROVAL_PENDING) as ExpertApprovalStatus;
  const canPublish =
    approvalStatus === EXPERT_APPROVAL_APPROVED && input.isPublished;

  const { error } = await admin
    .from("expert_profiles")
    .update({
      display_name: input.displayName.trim(),
      title: input.title.trim(),
      tradition: input.tradition.trim(),
      experience_years: Math.max(0, input.experienceYears),
      about_text: input.aboutText.trim(),
      about: input.aboutText.trim(),
      philosophy_text: input.philosophyText.trim(),
      is_published: canPublish,
      updated_at: new Date().toISOString(),
    })
    .eq("id", expert.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function upsertExpertServiceAction(input: {
  id?: string;
  name: string;
  description: string;
  crystalPrice: number;
  durationMinutes: number;
  isActive: boolean;
  imageUrl?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const profileId = await requireAuthUserId();
  const approved = await requireApprovedExpert(profileId);

  if (!approved.ok) {
    return approved;
  }

  const admin = createServiceRoleClient();
  const payload = {
    expert_profile_id: approved.expertId,
    name: input.name.trim(),
    description: input.description.trim(),
    crystal_price: Math.max(1, input.crystalPrice),
    duration_minutes: Math.max(15, input.durationMinutes),
    is_active: input.isActive,
    image_url: input.imageUrl?.trim() || null,
  };

  if (input.id) {
    const { error } = await admin
      .from("expert_services")
      .update(payload)
      .eq("id", input.id)
      .eq("expert_profile_id", approved.expertId);

    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await admin.from("expert_services").insert(payload);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function uploadExpertServiceImageAction(
  formData: FormData
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  try {
    const profileId = await requireAuthUserId();
    const approved = await requireApprovedExpert(profileId);

    if (!approved.ok) {
      return approved;
    }

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Geçerli bir görsel seçin." };
    }

    if (file.size > EXPERT_AVATAR_MAX_BYTES) {
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

    const objectPath = `services/${approved.expertId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const admin = createServiceRoleClient();

    const { error: uploadError } = await admin.storage
      .from(EXPERT_AVATARS_BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { ok: false, error: "Görsel yüklenemedi." };
    }

    const { data: publicUrlData } = admin.storage
      .from(EXPERT_AVATARS_BUCKET)
      .getPublicUrl(objectPath);

    return { ok: true, imageUrl: publicUrlData.publicUrl };
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}

export async function deleteExpertServiceAction(
  serviceId: string
): Promise<{ ok: boolean; error?: string }> {
  const profileId = await requireAuthUserId();
  const approved = await requireApprovedExpert(profileId);

  if (!approved.ok) {
    return approved;
  }

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("expert_services")
    .delete()
    .eq("id", serviceId)
    .eq("expert_profile_id", approved.expertId);

  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function upsertExpertArticleAction(input: {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  isPublished: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const profileId = await requireAuthUserId();
  const approved = await requireApprovedExpert(profileId);

  if (!approved.ok) {
    return approved;
  }

  const admin = createServiceRoleClient();
  const slug = input.slug.trim().toLowerCase().replace(/\s+/g, "-");
  const payload = {
    expert_profile_id: approved.expertId,
    title: input.title.trim(),
    slug,
    excerpt: input.excerpt.trim(),
    body: input.body.trim(),
    is_published: input.isPublished,
    published_at: input.isPublished ? new Date().toISOString() : null,
  };

  if (input.id) {
    const { error } = await admin
      .from("expert_articles")
      .update(payload)
      .eq("id", input.id)
      .eq("expert_profile_id", approved.expertId);

    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await admin.from("expert_articles").insert(payload);
  return error ? { ok: false, error: error.message } : { ok: true };
}
