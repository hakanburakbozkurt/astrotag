"use server";

import { findSimilarStoriesForViewer } from "@/lib/similar-stories/similar-stories.server";
import {
  createEmptySimilarStoriesBundle,
  createGuestSimilarStoriesTeaser,
  type ViewerSimilarStoriesBundle,
} from "@/lib/similar-stories/similar-stories.shared";
import { requireAuthUserId } from "@/lib/supabase-actions";

export async function getViewerSimilarStoriesAction(): Promise<ViewerSimilarStoriesBundle> {
  try {
    const profileId = await requireAuthUserId();
    const bundle = await findSimilarStoriesForViewer(profileId);
    return bundle ?? createEmptySimilarStoriesBundle();
  } catch {
    return createGuestSimilarStoriesTeaser();
  }
}
