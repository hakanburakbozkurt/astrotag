"use server";

import { requireAuthUserId } from "@/lib/supabase-actions";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type ExpertPanelData = {
  expertProfileId: string | null;
  isExpert: boolean;
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

  let { data: expert } = await admin
    .from("expert_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!expert) {
    const { data: created } = await admin
      .from("expert_profiles")
      .insert({
        profile_id: profileId,
        display_name: profile?.name?.trim() || "Uzman",
        title: "Kozmik Rehber",
        tradition: "Tarot",
        is_published: false,
      })
      .select("*")
      .single();

    expert = created;
  }

  if (!expert) {
    return null;
  }

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

  const { data: expert } = await admin
    .from("expert_profiles")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!expert?.id) {
    return { ok: false, error: "Uzman profili bulunamadı." };
  }

  const { error } = await admin
    .from("expert_profiles")
    .update({
      display_name: input.displayName.trim(),
      title: input.title.trim(),
      tradition: input.tradition.trim(),
      experience_years: Math.max(0, input.experienceYears),
      about_text: input.aboutText.trim(),
      philosophy_text: input.philosophyText.trim(),
      is_published: input.isPublished,
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
}): Promise<{ ok: boolean; error?: string }> {
  const profileId = await requireAuthUserId();
  const admin = createServiceRoleClient();

  const { data: expert } = await admin
    .from("expert_profiles")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!expert?.id) {
    return { ok: false, error: "Uzman profili yok." };
  }

  const payload = {
    expert_profile_id: expert.id,
    name: input.name.trim(),
    description: input.description.trim(),
    crystal_price: Math.max(1, input.crystalPrice),
    duration_minutes: Math.max(15, input.durationMinutes),
    is_active: input.isActive,
  };

  if (input.id) {
    const { error } = await admin
      .from("expert_services")
      .update(payload)
      .eq("id", input.id)
      .eq("expert_profile_id", expert.id);

    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await admin.from("expert_services").insert(payload);
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
  const admin = createServiceRoleClient();

  const { data: expert } = await admin
    .from("expert_profiles")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!expert?.id) {
    return { ok: false, error: "Uzman profili yok." };
  }

  const slug = input.slug.trim().toLowerCase().replace(/\s+/g, "-");
  const payload = {
    expert_profile_id: expert.id,
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
      .eq("expert_profile_id", expert.id);

    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await admin.from("expert_articles").insert(payload);
  return error ? { ok: false, error: error.message } : { ok: true };
}
