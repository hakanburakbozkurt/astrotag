import "server-only";

import { EXPERT_APPROVAL_APPROVED } from "@/lib/expert/expert-approval.shared";
import {
  parseExpertFeedSessionOutput,
  type ExpertFeedPost,
  type ExpertFeedSessionOutput,
} from "@/lib/experts/feed.shared";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { fetchExpertProfileByProfileId } from "@/lib/supabase/profile-query.server";

const FEED_PAGE_SIZE = 30;

type FeedRow = {
  id: string;
  expert_profile_id: string;
  user_profile_id: string | null;
  content_type: string;
  caption: string;
  media_url: string | null;
  session_output_data: unknown;
  service_request_id: string | null;
  share_consent: boolean;
  created_at: string;
  expert_profiles:
    | {
        display_name: string;
        title: string;
        avatar_url: string | null;
      }
    | Array<{
        display_name: string;
        title: string;
        avatar_url: string | null;
      }>
    | null;
  profiles:
    | { name: string | null }
    | Array<{ name: string | null }>
    | null;
};

function mapFeedRow(row: FeedRow): ExpertFeedPost | null {
  if (
    row.content_type !== "expert_announcement" &&
    row.content_type !== "shared_session"
  ) {
    return null;
  }

  const expertMeta = row.expert_profiles;
  const expertRow = Array.isArray(expertMeta) ? expertMeta[0] : expertMeta;
  if (!expertRow) {
    return null;
  }

  const userMeta = row.profiles;
  const userRow = Array.isArray(userMeta) ? userMeta[0] : userMeta;

  return {
    id: row.id,
    expertId: row.expert_profile_id,
    userId: row.user_profile_id,
    contentType: row.content_type,
    caption: row.caption?.trim() ?? "",
    mediaUrl: row.media_url?.trim() || null,
    sessionOutputData: parseExpertFeedSessionOutput(row.session_output_data),
    serviceRequestId: row.service_request_id,
    shareConsent: row.share_consent,
    createdAt: row.created_at,
    expert: {
      displayName: expertRow.display_name,
      title: expertRow.title,
      avatarUrl: expertRow.avatar_url,
    },
    userDisplayName: userRow?.name?.trim() || null,
  };
}

export async function listExpertFeedPosts(
  limit = FEED_PAGE_SIZE
): Promise<ExpertFeedPost[]> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("expert_feed")
    .select(
      `
      id,
      expert_profile_id,
      user_profile_id,
      content_type,
      caption,
      media_url,
      session_output_data,
      service_request_id,
      share_consent,
      created_at,
      expert_profiles!inner (
        display_name,
        title,
        avatar_url,
        is_published,
        approval_status
      ),
      profiles (
        name
      )
    `
    )
    .eq("is_published", true)
    .eq("expert_profiles.is_published", true)
    .eq("expert_profiles.approval_status", EXPERT_APPROVAL_APPROVED)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[listExpertFeedPosts]", error?.message);
    return [];
  }

  return (data as FeedRow[])
    .map(mapFeedRow)
    .filter((post): post is ExpertFeedPost => Boolean(post));
}

export async function createExpertAnnouncementPost(input: {
  profileId: string;
  caption: string;
  mediaUrl?: string | null;
}): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  const caption = input.caption.trim();
  if (!caption) {
    return { ok: false, error: "Gönderi metni boş olamaz." };
  }

  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("user_role")
    .eq("id", input.profileId)
    .maybeSingle();

  if (profile?.user_role !== "expert") {
    return { ok: false, error: "Yalnızca uzmanlar duyuru paylaşabilir." };
  }

  const { data: expert } = await fetchExpertProfileByProfileId<{
    id: string;
    approval_status: string | null;
  }>(admin, input.profileId, "id, approval_status");

  if (!expert || expert.approval_status !== EXPERT_APPROVAL_APPROVED) {
    return { ok: false, error: "Onaylı uzman profili bulunamadı." };
  }

  const { data: inserted, error } = await admin
    .from("expert_feed")
    .insert({
      expert_profile_id: expert.id,
      content_type: "expert_announcement",
      caption,
      media_url: input.mediaUrl?.trim() || null,
      share_consent: false,
    })
    .select("id")
    .limit(1);

  if (error || !inserted?.length) {
    console.error("[createExpertAnnouncementPost]", error?.message);
    return { ok: false, error: "Gönderi kaydedilemedi." };
  }

  return { ok: true, postId: inserted[0].id };
}

export async function shareExpertSessionToFeed(input: {
  profileId: string;
  serviceRequestId: string;
  caption?: string;
  sessionOutputData: ExpertFeedSessionOutput;
  shareConsent: boolean;
}): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  if (!input.shareConsent) {
    return { ok: false, error: "Akışta paylaşım için onay gerekli." };
  }

  const sessionOutput = parseExpertFeedSessionOutput(input.sessionOutputData);
  if (!sessionOutput) {
    return { ok: false, error: "Seans çıktısı geçersiz." };
  }

  const admin = createServiceRoleClient();
  const { data: requestRow, error: requestError } = await admin
    .from("expert_service_requests")
    .select("id, user_profile_id, expert_profile_id")
    .eq("id", input.serviceRequestId)
    .maybeSingle();

  if (requestError || !requestRow) {
    return { ok: false, error: "Seans talebi bulunamadı." };
  }

  if (requestRow.user_profile_id !== input.profileId) {
    return { ok: false, error: "Bu seans size ait değil." };
  }

  const { data: existingShare } = await admin
    .from("expert_feed")
    .select("id")
    .eq("service_request_id", input.serviceRequestId)
    .eq("content_type", "shared_session")
    .maybeSingle();

  if (existingShare) {
    return { ok: false, error: "Bu seans zaten akışta paylaşıldı." };
  }

  const { data: inserted, error } = await admin
    .from("expert_feed")
    .insert({
      expert_profile_id: requestRow.expert_profile_id,
      user_profile_id: input.profileId,
      content_type: "shared_session",
      caption: input.caption?.trim() ?? "",
      session_output_data: sessionOutput,
      service_request_id: input.serviceRequestId,
      share_consent: true,
    })
    .select("id")
    .limit(1);

  if (error || !inserted?.length) {
    console.error("[shareExpertSessionToFeed]", error?.message);
    return { ok: false, error: "Paylaşım kaydedilemedi." };
  }

  return { ok: true, postId: inserted[0].id };
}

export async function getShareableServiceRequest(input: {
  profileId: string;
  serviceRequestId: string;
}): Promise<
  | {
      ok: true;
      request: {
        id: string;
        expertProfileId: string;
        expertDisplayName: string;
        serviceName: string | null;
        createdAt: string;
      };
    }
  | { ok: false; error: string }
> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("expert_service_requests")
    .select(
      `
      id,
      created_at,
      expert_profile_id,
      expert_profiles (
        display_name
      ),
      expert_services (
        name
      )
    `
    )
    .eq("id", input.serviceRequestId)
    .eq("user_profile_id", input.profileId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Seans talebi bulunamadı." };
  }

  const expertMeta = data.expert_profiles as
    | { display_name: string }
    | Array<{ display_name: string }>
    | null;
  const expertRow = Array.isArray(expertMeta) ? expertMeta[0] : expertMeta;

  const serviceMeta = data.expert_services as
    | { name: string }
    | Array<{ name: string }>
    | null;
  const serviceRow = Array.isArray(serviceMeta) ? serviceMeta[0] : serviceMeta;

  return {
    ok: true,
    request: {
      id: data.id,
      expertProfileId: data.expert_profile_id,
      expertDisplayName: expertRow?.display_name ?? "Uzman",
      serviceName: serviceRow?.name?.trim() || null,
      createdAt: data.created_at,
    },
  };
}
