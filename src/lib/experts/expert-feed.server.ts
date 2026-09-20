import "server-only";

import { EXPERT_APPROVAL_APPROVED } from "@/lib/expert/expert-approval.shared";
import { assertExpertHasAvatarByProfileId } from "@/lib/experts/expert-avatar-guard.server";
import { EXPERT_AVATAR_REQUIRED_CODE } from "@/lib/experts/expert-avatar-required.shared";
import {
  FEED_MAX_CAPTION_LENGTH,
  FEED_MAX_REPLY_LENGTH,
  USER_DAILY_POST_LIMIT,
  isFeedContextTag,
  type FeedContextTag,
} from "@/lib/feed/feed-context-tags.shared";
import { moderateFeedText } from "@/lib/feed/feed-moderation.shared";
import {
  assertUserDailyLikeLimit,
  assertUserDailyPostLimit,
  countUserPostsForIstanbulDay,
} from "@/lib/feed/feed-rate-limit.server";
import {
  feedContextTagLabel,
  parseExpertFeedSessionOutput,
  type FeedComposerStatus,
  type FeedPost,
  type FeedReply,
  type ExpertFeedSessionOutput,
} from "@/lib/experts/feed.shared";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { fetchExpertProfileByProfileId } from "@/lib/supabase/profile-query.server";

const FEED_PAGE_SIZE = 40;
const REPLIES_PREVIEW_LIMIT = 3;

type FeedRow = {
  id: string;
  expert_profile_id: string | null;
  user_profile_id: string | null;
  content_type: string;
  caption: string;
  media_url: string | null;
  context_tag: string | null;
  session_output_data: unknown;
  service_request_id: string | null;
  share_consent: boolean;
  created_at: string;
  expert_profiles:
    | {
        display_name: string;
        title: string;
        avatar_url: string | null;
        is_published: boolean;
        approval_status: string;
      }
    | Array<{
        display_name: string;
        title: string;
        avatar_url: string | null;
        is_published: boolean;
        approval_status: string;
      }>
    | null;
  profiles:
    | { name: string | null; avatar_url: string | null; user_role: string | null }
    | Array<{ name: string | null; avatar_url: string | null; user_role: string | null }>
    | null;
};

function resolveProfileRow(
  profiles: FeedRow["profiles"]
): { name: string | null; avatar_url: string | null; user_role: string | null } | null {
  if (!profiles) {
    return null;
  }
  return Array.isArray(profiles) ? profiles[0] ?? null : profiles;
}

function isExpertContentVisible(
  contentType: string,
  expertMeta: FeedRow["expert_profiles"]
): boolean {
  if (contentType === "user_post") {
    return true;
  }

  const expertRow = Array.isArray(expertMeta) ? expertMeta[0] : expertMeta;
  if (!expertRow) {
    return false;
  }

  return (
    expertRow.is_published === true &&
    expertRow.approval_status === EXPERT_APPROVAL_APPROVED
  );
}

function mapFeedRow(
  row: FeedRow,
  engagement: {
    likeCount: number;
    replyCount: number;
    likedByViewer: boolean;
    replies: FeedReply[];
  }
): FeedPost | null {
  if (
    row.content_type !== "expert_announcement" &&
    row.content_type !== "shared_session" &&
    row.content_type !== "user_post"
  ) {
    return null;
  }

  if (!isExpertContentVisible(row.content_type, row.expert_profiles)) {
    return null;
  }

  const expertMeta = row.expert_profiles;
  const expertRow = Array.isArray(expertMeta) ? expertMeta[0] : expertMeta;
  const profileRow = resolveProfileRow(row.profiles);

  const authorProfileId = row.user_profile_id ?? "";
  const authorDisplayName =
    row.content_type === "user_post"
      ? profileRow?.name?.trim() || "Gezgin"
      : expertRow?.display_name ?? profileRow?.name?.trim() ?? "Gezgin";

  const authorAvatarUrl =
    row.content_type === "user_post"
      ? profileRow?.avatar_url ?? null
      : expertRow?.avatar_url ?? profileRow?.avatar_url ?? null;

  const contextTag =
    row.context_tag && isFeedContextTag(row.context_tag) ? row.context_tag : null;

  return {
    id: row.id,
    expertId: row.expert_profile_id,
    userId: row.user_profile_id,
    contentType: row.content_type,
    caption: row.caption?.trim() ?? "",
    mediaUrl: row.media_url?.trim() || null,
    contextTag,
    contextTagLabel: contextTag ? feedContextTagLabel(contextTag) : null,
    sessionOutputData: parseExpertFeedSessionOutput(row.session_output_data),
    serviceRequestId: row.service_request_id,
    shareConsent: row.share_consent,
    createdAt: row.created_at,
    likeCount: engagement.likeCount,
    replyCount: engagement.replyCount,
    likedByViewer: engagement.likedByViewer,
    expert: expertRow
      ? {
          displayName: expertRow.display_name,
          title: expertRow.title,
          avatarUrl: expertRow.avatar_url,
        }
      : null,
    author: {
      profileId: authorProfileId,
      displayName: authorDisplayName,
      avatarUrl: authorAvatarUrl,
      isExpert: profileRow?.user_role === "expert" || Boolean(expertRow),
    },
    replies: engagement.replies,
  };
}

async function loadEngagement(
  postIds: string[],
  viewerProfileId: string | null
): Promise<
  Map<
    string,
    { likeCount: number; replyCount: number; likedByViewer: boolean; replies: FeedReply[] }
  >
> {
  const result = new Map<
    string,
    { likeCount: number; replyCount: number; likedByViewer: boolean; replies: FeedReply[] }
  >();

  if (postIds.length === 0) {
    return result;
  }

  const admin = createServiceRoleClient();

  const [{ data: likes }, { data: replies }] = await Promise.all([
    admin.from("feed_likes").select("post_id, profile_id").in("post_id", postIds),
    admin
      .from("feed_replies")
      .select("id, post_id, body, created_at, profile_id, profiles(name, avatar_url)")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
  ]);

  for (const postId of postIds) {
    result.set(postId, {
      likeCount: 0,
      replyCount: 0,
      likedByViewer: false,
      replies: [],
    });
  }

  for (const like of likes ?? []) {
    const bucket = result.get(like.post_id);
    if (!bucket) {
      continue;
    }
    bucket.likeCount += 1;
    if (viewerProfileId && like.profile_id === viewerProfileId) {
      bucket.likedByViewer = true;
    }
  }

  const repliesByPost = new Map<string, FeedReply[]>();

  for (const reply of replies ?? []) {
    const profileMeta = reply.profiles as
      | { name: string | null; avatar_url: string | null }
      | Array<{ name: string | null; avatar_url: string | null }>
      | null;
    const profileRow = Array.isArray(profileMeta) ? profileMeta[0] : profileMeta;

    const mapped: FeedReply = {
      id: reply.id,
      body: reply.body,
      createdAt: reply.created_at,
      author: {
        profileId: reply.profile_id,
        displayName: profileRow?.name?.trim() || "Gezgin",
        avatarUrl: profileRow?.avatar_url ?? null,
      },
    };

    const list = repliesByPost.get(reply.post_id) ?? [];
    list.push(mapped);
    repliesByPost.set(reply.post_id, list);

    const bucket = result.get(reply.post_id);
    if (bucket) {
      bucket.replyCount += 1;
    }
  }

  for (const [postId, bucket] of result) {
    bucket.replies = (repliesByPost.get(postId) ?? []).slice(-REPLIES_PREVIEW_LIMIT);
  }

  return result;
}

export async function listExpertFeedPosts(
  limit = FEED_PAGE_SIZE,
  viewerProfileId: string | null = null
): Promise<FeedPost[]> {
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
      context_tag,
      session_output_data,
      service_request_id,
      share_consent,
      created_at,
      expert_profiles (
        display_name,
        title,
        avatar_url,
        is_published,
        approval_status
      ),
      profiles (
        name,
        avatar_url,
        user_role
      )
    `
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[listExpertFeedPosts]", error?.message);
    return [];
  }

  const rows = (data as FeedRow[]).filter((row) =>
    isExpertContentVisible(row.content_type, row.expert_profiles)
  );

  const postIds = rows.map((row) => row.id);
  const engagement = await loadEngagement(postIds, viewerProfileId);

  return rows
    .map((row) =>
      mapFeedRow(row, engagement.get(row.id) ?? {
        likeCount: 0,
        replyCount: 0,
        likedByViewer: false,
        replies: [],
      })
    )
    .filter((post): post is FeedPost => Boolean(post));
}

export async function getFeedComposerStatus(
  profileId: string
): Promise<FeedComposerStatus | null> {
  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const used = await countUserPostsForIstanbulDay(profileId);
  const remaining = Math.max(0, USER_DAILY_POST_LIMIT - used);

  return {
    canPost: remaining > 0,
    remainingPostsToday: remaining,
    dailyLimit: USER_DAILY_POST_LIMIT,
    displayName: profile.name?.trim() || "Gezgin",
    avatarUrl: profile.avatar_url,
  };
}

export async function createUserFeedPost(input: {
  profileId: string;
  caption: string;
  contextTag: FeedContextTag;
}): Promise<
  | { ok: true; postId: string }
  | { ok: false; error: string; code?: string }
> {
  if (!isFeedContextTag(input.contextTag)) {
    return { ok: false, error: "Geçerli bir bağlam etiketi seçin." };
  }

  const caption = input.caption.trim();
  if (!caption) {
    return { ok: false, error: "Gönderi metni boş olamaz." };
  }

  if (caption.length > FEED_MAX_CAPTION_LENGTH) {
    return {
      ok: false,
      error: `Gönderi en fazla ${FEED_MAX_CAPTION_LENGTH} karakter olabilir.`,
    };
  }

  const moderation = moderateFeedText(caption);
  if (!moderation.ok) {
    return { ok: false, error: moderation.reason, code: "FEED_MODERATION" };
  }

  const rateLimit = await assertUserDailyPostLimit(input.profileId);
  if (!rateLimit.ok) {
    return { ok: false, error: rateLimit.error, code: "FEED_RATE_LIMIT" };
  }

  const admin = createServiceRoleClient();
  const { data: inserted, error } = await admin
    .from("expert_feed")
    .insert({
      content_type: "user_post",
      user_profile_id: input.profileId,
      caption,
      context_tag: input.contextTag,
      share_consent: false,
    })
    .select("id")
    .limit(1);

  if (error || !inserted?.length) {
    console.error("[createUserFeedPost]", error?.message);
    return { ok: false, error: "Gönderi kaydedilemedi." };
  }

  return { ok: true, postId: inserted[0].id };
}

function moderateOptionalCaption(caption: string | undefined): { ok: true; text: string } | { ok: false; error: string } {
  const text = caption?.trim() ?? "";
  if (!text) {
    return { ok: true, text: "" };
  }

  const moderation = moderateFeedText(text);
  if (!moderation.ok) {
    return { ok: false, error: moderation.reason };
  }

  if (text.length > FEED_MAX_CAPTION_LENGTH) {
    return {
      ok: false,
      error: `Metin en fazla ${FEED_MAX_CAPTION_LENGTH} karakter olabilir.`,
    };
  }

  return { ok: true, text };
}

export async function createExpertAnnouncementPost(input: {
  profileId: string;
  caption: string;
  mediaUrl?: string | null;
}): Promise<
  | { ok: true; postId: string }
  | { ok: false; error: string; code?: typeof EXPERT_AVATAR_REQUIRED_CODE | "FEED_MODERATION" }
> {
  const caption = input.caption.trim();
  if (!caption) {
    return { ok: false, error: "Gönderi metni boş olamaz." };
  }

  const moderation = moderateFeedText(caption);
  if (!moderation.ok) {
    return { ok: false, error: moderation.reason, code: "FEED_MODERATION" };
  }

  if (caption.length > FEED_MAX_CAPTION_LENGTH) {
    return {
      ok: false,
      error: `Gönderi en fazla ${FEED_MAX_CAPTION_LENGTH} karakter olabilir.`,
    };
  }

  const avatarGuard = await assertExpertHasAvatarByProfileId(input.profileId);
  if (!avatarGuard.ok) {
    return avatarGuard;
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

  const captionResult = moderateOptionalCaption(input.caption);
  if (!captionResult.ok) {
    return { ok: false, error: captionResult.error };
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
      caption: captionResult.text,
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

export async function toggleFeedLike(input: {
  profileId: string;
  postId: string;
}): Promise<
  | { ok: true; liked: boolean; likeCount: number }
  | { ok: false; error: string }
> {
  const admin = createServiceRoleClient();

  const { data: post } = await admin
    .from("expert_feed")
    .select("id")
    .eq("id", input.postId)
    .eq("is_published", true)
    .maybeSingle();

  if (!post) {
    return { ok: false, error: "Gönderi bulunamadı." };
  }

  const { data: existing } = await admin
    .from("feed_likes")
    .select("id")
    .eq("post_id", input.postId)
    .eq("profile_id", input.profileId)
    .maybeSingle();

  if (existing) {
    await admin.from("feed_likes").delete().eq("id", existing.id);
  } else {
    const likeLimit = await assertUserDailyLikeLimit(input.profileId);
    if (!likeLimit.ok) {
      return { ok: false, error: likeLimit.error };
    }

    const { error } = await admin.from("feed_likes").insert({
      post_id: input.postId,
      profile_id: input.profileId,
    });

    if (error) {
      return { ok: false, error: "Beğeni kaydedilemedi." };
    }
  }

  const { count } = await admin
    .from("feed_likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", input.postId);

  return {
    ok: true,
    liked: !existing,
    likeCount: count ?? 0,
  };
}

export async function createFeedReply(input: {
  profileId: string;
  postId: string;
  body: string;
}): Promise<
  | { ok: true; replyId: string }
  | { ok: false; error: string; code?: string }
> {
  const body = input.body.trim();
  if (!body) {
    return { ok: false, error: "Yanıt boş olamaz." };
  }

  if (body.length > FEED_MAX_REPLY_LENGTH) {
    return {
      ok: false,
      error: `Yanıt en fazla ${FEED_MAX_REPLY_LENGTH} karakter olabilir.`,
    };
  }

  const moderation = moderateFeedText(body);
  if (!moderation.ok) {
    return { ok: false, error: moderation.reason, code: "FEED_MODERATION" };
  }

  const admin = createServiceRoleClient();
  const { data: post } = await admin
    .from("expert_feed")
    .select("id")
    .eq("id", input.postId)
    .eq("is_published", true)
    .maybeSingle();

  if (!post) {
    return { ok: false, error: "Gönderi bulunamadı." };
  }

  const { data: inserted, error } = await admin
    .from("feed_replies")
    .insert({
      post_id: input.postId,
      profile_id: input.profileId,
      body,
    })
    .select("id")
    .limit(1);

  if (error || !inserted?.length) {
    return { ok: false, error: "Yanıt kaydedilemedi." };
  }

  return { ok: true, replyId: inserted[0].id };
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
