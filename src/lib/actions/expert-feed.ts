"use server";

import {
  createExpertAnnouncementPost,
  createFeedReply,
  createUserFeedPost,
  getFeedComposerStatus,
  listExpertFeedPosts,
  shareExpertSessionToFeed,
  toggleFeedLike,
} from "@/lib/experts/expert-feed.server";
import type {
  FeedComposerStatus,
  FeedPost,
  ExpertFeedSessionOutput,
} from "@/lib/experts/feed.shared";
import type { FeedContextTag } from "@/lib/feed/feed-context-tags.shared";
import { requireAuthUserId } from "@/lib/supabase-actions";
import { getProtectedNfcAccess } from "@/lib/nfc/protected-access.server";

async function resolveViewerProfileId(): Promise<string | null> {
  try {
    const access = await getProtectedNfcAccess();
    return access?.profileId ?? null;
  } catch {
    return null;
  }
}

export async function listExpertFeedAction(): Promise<FeedPost[]> {
  const viewerProfileId = await resolveViewerProfileId();
  return listExpertFeedPosts(40, viewerProfileId);
}

export async function getFeedComposerStatusAction(): Promise<FeedComposerStatus | null> {
  try {
    const profileId = await requireAuthUserId();
    return getFeedComposerStatus(profileId);
  } catch {
    return null;
  }
}

export async function createUserFeedPostAction(input: {
  caption: string;
  contextTag: FeedContextTag;
}): Promise<{ ok: boolean; error?: string; postId?: string; code?: string }> {
  try {
    const profileId = await requireAuthUserId();
    const result = await createUserFeedPost({
      profileId,
      caption: input.caption,
      contextTag: input.contextTag,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        code: "code" in result ? result.code : undefined,
      };
    }

    return { ok: true, postId: result.postId };
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}

export async function createExpertAnnouncementAction(input: {
  caption: string;
  mediaUrl?: string | null;
}): Promise<{
  ok: boolean;
  error?: string;
  postId?: string;
  code?: string;
}> {
  try {
    const profileId = await requireAuthUserId();
    const result = await createExpertAnnouncementPost({
      profileId,
      caption: input.caption,
      mediaUrl: input.mediaUrl,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        code: "code" in result ? result.code : undefined,
      };
    }

    return { ok: true, postId: result.postId };
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}

export async function shareSessionToFeedAction(input: {
  serviceRequestId: string;
  caption?: string;
  sessionOutputData: ExpertFeedSessionOutput;
  shareConsent: boolean;
}): Promise<{
  ok: boolean;
  error?: string;
  postId?: string;
  code?: string;
}> {
  try {
    const profileId = await requireAuthUserId();
    const result = await shareExpertSessionToFeed({
      profileId,
      serviceRequestId: input.serviceRequestId,
      caption: input.caption,
      sessionOutputData: input.sessionOutputData,
      shareConsent: input.shareConsent,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return { ok: true, postId: result.postId };
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}

export async function toggleFeedLikeAction(
  postId: string
): Promise<
  | { ok: true; liked: boolean; likeCount: number }
  | { ok: false; error: string }
> {
  try {
    const profileId = await requireAuthUserId();
    return toggleFeedLike({ profileId, postId });
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}

export async function createFeedReplyAction(input: {
  postId: string;
  body: string;
}): Promise<{ ok: boolean; error?: string; replyId?: string; code?: string }> {
  try {
    const profileId = await requireAuthUserId();
    const result = await createFeedReply({
      profileId,
      postId: input.postId,
      body: input.body,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        code: "code" in result ? result.code : undefined,
      };
    }

    return { ok: true, replyId: result.replyId };
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}
