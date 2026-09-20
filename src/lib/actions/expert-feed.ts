"use server";

import {
  createExpertAnnouncementPost,
  listExpertFeedPosts,
  shareExpertSessionToFeed,
} from "@/lib/experts/expert-feed.server";
import type {
  ExpertFeedPost,
  ExpertFeedSessionOutput,
} from "@/lib/experts/feed.shared";
import { requireAuthUserId } from "@/lib/supabase-actions";

export async function listExpertFeedAction(): Promise<ExpertFeedPost[]> {
  return listExpertFeedPosts();
}

export async function createExpertAnnouncementAction(input: {
  caption: string;
  mediaUrl?: string | null;
}): Promise<{ ok: boolean; error?: string; postId?: string }> {
  try {
    const profileId = await requireAuthUserId();
    const result = await createExpertAnnouncementPost({
      profileId,
      caption: input.caption,
      mediaUrl: input.mediaUrl,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
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
}): Promise<{ ok: boolean; error?: string; postId?: string }> {
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
