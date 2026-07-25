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
  email: string | null;
  submittedAt: string;
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
      "id, profile_id, display_name, title, tradition, experience_years, about_text, created_at"
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
    .select("id, user_id, user_role")
    .in("id", profileIds)
    .eq("user_role", "expert");

  const userIdByProfileId = new Map<string, string>();
  for (const profile of profiles ?? []) {
    if (profile.user_id) {
      userIdByProfileId.set(profile.id, profile.user_id);
    }
  }

  const experts: AdminPendingExpert[] = [];

  for (const row of rows) {
    const authUserId = userIdByProfileId.get(row.profile_id);
    if (!authUserId) {
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
      email: await getAuthUserEmail(authUserId),
      submittedAt: row.created_at,
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
