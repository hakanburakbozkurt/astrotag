import "server-only";

import {
  crystalsToTry,
  computeCommissionSplit,
  DEFAULT_CRYSTAL_UNIT_TRY,
} from "@/lib/payments/commission.shared";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type WalletBalances = {
  starPoints: number;
  starPointsBonus: number;
  totalStarPoints: number;
  crystalBalance: number;
};

export async function getWalletBalances(profileId: string): Promise<WalletBalances | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .select("star_points, star_points_bonus, crystal_balance")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const starPoints = data.star_points ?? 0;
  const starPointsBonus = data.star_points_bonus ?? 0;

  return {
    starPoints,
    starPointsBonus,
    totalStarPoints: starPoints + starPointsBonus,
    crystalBalance: data.crystal_balance ?? 0,
  };
}

export type ExpertPublicProfile = {
  id: string;
  profileId: string;
  displayName: string;
  title: string;
  tradition: string;
  experienceYears: number;
  aboutText: string;
  philosophyText: string;
  avatarUrl: string | null;
  services: ExpertServiceRow[];
  articles: ExpertArticleRow[];
};

export type ExpertServiceRow = {
  id: string;
  name: string;
  description: string;
  crystalPrice: number;
  durationMinutes: number;
};

export type ExpertArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  publishedAt: string | null;
};

export async function listPublishedExperts(): Promise<
  Array<
    Pick<
      ExpertPublicProfile,
      "id" | "displayName" | "title" | "tradition" | "experienceYears" | "avatarUrl"
    >
  >
> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("expert_profiles")
    .select("id, display_name, title, tradition, experience_years, avatar_url")
    .eq("is_published", true)
    .order("vitrine_sort", { ascending: true });

  if (error || !data) {
    console.error("[listPublishedExperts]", error?.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    title: row.title,
    tradition: row.tradition,
    experienceYears: row.experience_years,
    avatarUrl: row.avatar_url,
  }));
}

export async function getExpertPublicProfile(
  expertProfileId: string
): Promise<ExpertPublicProfile | null> {
  const admin = createServiceRoleClient();

  const { data: expert, error } = await admin
    .from("expert_profiles")
    .select(
      "id, profile_id, display_name, title, tradition, experience_years, about_text, philosophy_text, avatar_url"
    )
    .eq("id", expertProfileId)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !expert) {
    return null;
  }

  const [{ data: services }, { data: articles }] = await Promise.all([
    admin
      .from("expert_services")
      .select("id, name, description, crystal_price, duration_minutes")
      .eq("expert_profile_id", expertProfileId)
      .eq("is_active", true)
      .order("sort_order"),
    admin
      .from("expert_articles")
      .select("id, title, slug, excerpt, body, published_at")
      .eq("expert_profile_id", expertProfileId)
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
  ]);

  return {
    id: expert.id,
    profileId: expert.profile_id,
    displayName: expert.display_name,
    title: expert.title,
    tradition: expert.tradition,
    experienceYears: expert.experience_years,
    aboutText: expert.about_text,
    philosophyText: expert.philosophy_text,
    avatarUrl: expert.avatar_url,
    services: (services ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      crystalPrice: s.crystal_price,
      durationMinutes: s.duration_minutes,
    })),
    articles: (articles ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      body: a.body,
      publishedAt: a.published_at,
    })),
  };
}

export async function recordExpertServicePurchase(input: {
  userProfileId: string;
  expertProfileId: string;
  serviceId: string;
  crystalUnitTry?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = createServiceRoleClient();
  const unitTry = input.crystalUnitTry ?? DEFAULT_CRYSTAL_UNIT_TRY;

  const { data: service } = await admin
    .from("expert_services")
    .select("id, crystal_price, expert_profile_id, is_active")
    .eq("id", input.serviceId)
    .eq("expert_profile_id", input.expertProfileId)
    .maybeSingle();

  if (!service?.is_active) {
    return { ok: false, error: "Hizmet bulunamadı." };
  }

  const { data: userProfile } = await admin
    .from("profiles")
    .select("crystal_balance")
    .eq("id", input.userProfileId)
    .maybeSingle();

  const balance = userProfile?.crystal_balance ?? 0;
  if (balance < service.crystal_price) {
    return { ok: false, error: "Yetersiz kristal bakiyesi." };
  }

  const grossTry = crystalsToTry(service.crystal_price, unitTry);
  const split = computeCommissionSplit(grossTry);

  const { error: balanceError } = await admin
    .from("profiles")
    .update({ crystal_balance: balance - service.crystal_price })
    .eq("id", input.userProfileId);

  if (balanceError) {
    return { ok: false, error: "Kristal düşülemedi." };
  }

  const { data: expertRow } = await admin
    .from("expert_profiles")
    .select("earnings_balance_try")
    .eq("id", input.expertProfileId)
    .maybeSingle();

  const nextEarnings =
    Number(expertRow?.earnings_balance_try ?? 0) + split.expertPayoutTry;

  await admin
    .from("expert_profiles")
    .update({ earnings_balance_try: nextEarnings })
    .eq("id", input.expertProfileId);

  await admin.from("expert_earnings_ledger").insert({
    expert_profile_id: input.expertProfileId,
    user_profile_id: input.userProfileId,
    service_id: input.serviceId,
    crystals_spent: service.crystal_price,
    gross_try: split.grossTry,
    platform_commission_try: split.platformCommissionTry,
    expert_payout_try: split.expertPayoutTry,
    commission_rate: split.commissionRate,
    status: "completed",
  });

  return { ok: true };
}
