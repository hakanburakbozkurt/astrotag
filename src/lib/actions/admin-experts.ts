"use server";

import { requireAdminUser } from "@/lib/admin/admin-auth.server";
import { getAuthUserEmail } from "@/lib/expert/expert-auth-email.server";
import { EXPERT_APPROVAL_APPROVED } from "@/lib/expert/expert-approval.shared";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type AdminPendingExpert = {
  expertProfileId: string;
  profileId: string;
  displayName: string;
  title: string;
  tradition: string;
  experienceYears: number;
  aboutText: string;
  about: string | null;
  experienceText: string | null;
  philosophyText: string;
  phoneNumber: string | null;
  socialProfileUrl: string | null;
  avatarUrl: string | null;
  approvalStatus: string;
  isPublished: boolean;
  vitrineSort: number;
  expertCode: string | null;
  nfcUid: string | null;
  email: string | null;
  submittedAt: string;
  updatedAt: string;
};

export type AdminPendingExpertsResult =
  | { ok: true; experts: AdminPendingExpert[] }
  | { ok: false; error: string };

export type ApproveExpertResult =
  | { ok: true }
  | { ok: false; error: string };

export async function listPendingExpertApplicationsAction(): Promise<AdminPendingExpertsResult> {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    return { ok: false, error: admin.error };
  }

  const supabase = createServiceRoleClient();
  const { data: rows, error } = await supabase
    .from("expert_profiles")
    .select(
      "id, profile_id, display_name, title, tradition, experience_years, about_text, about, experience_text, philosophy_text, phone_number, social_profile_url, avatar_url, approval_status, is_published, vitrine_sort, created_at, updated_at"
    )
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!rows?.length) {
    return { ok: true, experts: [] };
  }

  const profileIds = rows.map((row) => row.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, user_id, user_role, expert_code, nfc_uid")
    .in("id", profileIds)
    .eq("user_role", "expert");

  const profileById = new Map<
    string,
    { userId: string; expertCode: string | null; nfcUid: string | null }
  >();
  for (const profile of profiles ?? []) {
    if (profile.user_id) {
      profileById.set(profile.id, {
        userId: profile.user_id,
        expertCode: profile.expert_code ?? null,
        nfcUid: profile.nfc_uid ?? null,
      });
    }
  }

  const experts: AdminPendingExpert[] = [];

  for (const row of rows) {
    const linkedProfile = profileById.get(row.profile_id);
    if (!linkedProfile) {
      continue;
    }

    experts.push({
      expertProfileId: row.id,
      profileId: row.profile_id,
      displayName: row.display_name,
      title: row.title,
      tradition: row.tradition,
      experienceYears: row.experience_years ?? 0,
      aboutText: row.about_text ?? "",
      about: row.about ?? null,
      experienceText: row.experience_text ?? null,
      philosophyText: row.philosophy_text ?? "",
      phoneNumber: row.phone_number ?? null,
      socialProfileUrl: row.social_profile_url ?? null,
      avatarUrl: row.avatar_url ?? null,
      approvalStatus: row.approval_status ?? "pending",
      isPublished: row.is_published === true,
      vitrineSort: row.vitrine_sort ?? 0,
      expertCode: linkedProfile.expertCode,
      nfcUid: linkedProfile.nfcUid,
      email: await getAuthUserEmail(linkedProfile.userId),
      submittedAt: row.created_at,
      updatedAt: row.updated_at ?? row.created_at,
    });
  }

  return { ok: true, experts };
}

export async function approveExpertApplicationAction(
  expertProfileId: string
): Promise<ApproveExpertResult> {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    return { ok: false, error: admin.error };
  }

  const supabase = createServiceRoleClient();
  const { data: expert, error: lookupError } = await supabase
    .from("expert_profiles")
    .select("id, approval_status")
    .eq("id", expertProfileId)
    .maybeSingle();

  if (lookupError || !expert?.id) {
    return { ok: false, error: "Uzman başvurusu bulunamadı." };
  }

  if (expert.approval_status === EXPERT_APPROVAL_APPROVED) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("expert_profiles")
    .update({
      approval_status: EXPERT_APPROVAL_APPROVED,
      is_published: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", expertProfileId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
