"use server";

import { findSimilarStoriesForViewer } from "@/lib/similar-stories/similar-stories.server";
import type { ViewerSimilarStoriesBundle } from "@/lib/similar-stories/similar-stories.shared";
import { requireAuthUserId } from "@/lib/supabase-actions";

export async function getViewerSimilarStoriesAction(): Promise<ViewerSimilarStoriesBundle | null> {
  try {
    const profileId = await requireAuthUserId();
    return findSimilarStoriesForViewer(profileId);
  } catch {
    return null;
  }
}
