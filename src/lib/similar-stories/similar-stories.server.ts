import "server-only";

import { callKieChat } from "@/lib/ai/kie-client";
import { isFeedContextTag, feedContextTagLabel } from "@/lib/feed/feed-context-tags.shared";
import { getServerUserProfile } from "@/lib/tarot/tarot-profile-server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  buildFeedCosmicSnapshot,
  hasCompleteBirthProfileForCosmic,
} from "@/lib/similar-stories/cosmic-snapshot.server";
import {
  SIMILAR_STORY_MATCH_WINDOW_DAYS,
  SIMILAR_STORY_MIN_SCORE,
  buildDeterministicEmpathyInsight,
  isEmotionalStateTag,
  parseFeedCosmicSnapshot,
  resolveFeedCosmicSnapshot,
  scoreSimilarStoryMatch,
  type EmotionalStateTag,
  type FeedCosmicSnapshot,
  type SimilarStoryHint,
  type SimilarStoryMatch,
  type ViewerSimilarStoriesBundle,
} from "@/lib/similar-stories/similar-stories.shared";
import type { FeedContextTag } from "@/lib/feed/feed-context-tags.shared";

const ISTANBUL_TZ = "Europe/Istanbul";
const MATCH_POOL_LIMIT = 120;

type CandidateRow = {
  id: string;
  user_profile_id: string;
  caption: string;
  context_tag: string;
  cosmic_snapshot: unknown;
  daily_state_text: string | null;
  emotional_state_tag: string | null;
  created_at: string;
};

type ViewerContext = {
  profileId: string;
  matchingSnapshot: FeedCosmicSnapshot | null;
  hasRealCosmicProfile: boolean;
  contextTag: FeedContextTag | null;
  emotionalTag: EmotionalStateTag | null;
  stateText: string;
  caption: string;
};

function getIstanbulDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function matchWindowStartIso(): string {
  const start = new Date();
  start.setDate(start.getDate() - SIMILAR_STORY_MATCH_WINDOW_DAYS);
  return start.toISOString();
}

function anonymizeExcerpt(caption: string, dailyState: string | null): string {
  const source = dailyState?.trim() || caption.trim();
  if (!source) {
    return "Kısa bir kozmik yansıma paylaşıldı.";
  }

  const clipped = source.length > 96 ? `${source.slice(0, 93).trim()}…` : source;
  return clipped;
}

async function loadViewerContext(profileId: string): Promise<ViewerContext | null> {
  const profile = await getServerUserProfile(profileId);
  if (!profile) {
    return null;
  }

  const admin = createServiceRoleClient();
  const snapshot = hasCompleteBirthProfileForCosmic(profile)
    ? await buildFeedCosmicSnapshot(profile)
    : null;

  const { data: latestPost } = await admin
    .from("expert_feed")
    .select(
      "context_tag, caption, daily_state_text, emotional_state_tag, cosmic_snapshot"
    )
    .eq("user_profile_id", profileId)
    .eq("content_type", "user_post")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: dailyState } = await admin
    .from("user_daily_states")
    .select("state_text, emotional_state_tag, context_tag, cosmic_snapshot")
    .eq("profile_id", profileId)
    .eq("state_date", getIstanbulDateKey())
    .maybeSingle();

  const contextTagRaw =
    latestPost?.context_tag ?? dailyState?.context_tag ?? null;
  const contextTag =
    contextTagRaw && isFeedContextTag(contextTagRaw) ? contextTagRaw : null;

  const emotionalRaw =
    latestPost?.emotional_state_tag ?? dailyState?.emotional_state_tag ?? null;
  const emotionalTag =
    emotionalRaw && isEmotionalStateTag(emotionalRaw) ? emotionalRaw : null;

  const dailyContextTag =
    dailyState?.context_tag && isFeedContextTag(dailyState.context_tag)
      ? dailyState.context_tag
      : null;
  const resolvedContextTag = contextTag ?? dailyContextTag;

  const realSnapshot =
    snapshot ??
    parseFeedCosmicSnapshot(latestPost?.cosmic_snapshot) ??
    parseFeedCosmicSnapshot(dailyState?.cosmic_snapshot);

  const matchingSnapshot =
    realSnapshot ??
    resolveFeedCosmicSnapshot(
      latestPost?.cosmic_snapshot ?? dailyState?.cosmic_snapshot,
      resolvedContextTag
    );

  return {
    profileId,
    matchingSnapshot,
    hasRealCosmicProfile: Boolean(realSnapshot),
    contextTag: resolvedContextTag,
    emotionalTag,
    stateText: dailyState?.state_text?.trim() ?? latestPost?.daily_state_text?.trim() ?? "",
    caption: latestPost?.caption?.trim() ?? "",
  };
}

async function loadCandidatePool(excludeProfileId: string): Promise<CandidateRow[]> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("expert_feed")
    .select(
      "id, user_profile_id, caption, context_tag, cosmic_snapshot, daily_state_text, emotional_state_tag, created_at"
    )
    .eq("content_type", "user_post")
    .neq("user_profile_id", excludeProfileId)
    .gte("created_at", matchWindowStartIso())
    .order("created_at", { ascending: false })
    .limit(MATCH_POOL_LIMIT);

  if (error || !data) {
    console.error("[loadCandidatePool]", error?.message);
    return [];
  }

  return data.filter(
    (row): row is CandidateRow =>
      typeof row.context_tag === "string" && isFeedContextTag(row.context_tag)
  );
}

function rankCandidates(
  viewer: ViewerContext,
  candidates: CandidateRow[]
): SimilarStoryMatch[] {
  const ranked: SimilarStoryMatch[] = [];

  for (const row of candidates) {
    const candidateSnapshot = resolveFeedCosmicSnapshot(
      row.cosmic_snapshot,
      row.context_tag as FeedContextTag
    );
    const candidateEmotional =
      row.emotional_state_tag && isEmotionalStateTag(row.emotional_state_tag)
        ? row.emotional_state_tag
        : null;

    const { score, sharedSignals } = scoreSimilarStoryMatch({
      viewerSnapshot: viewer.matchingSnapshot,
      candidateSnapshot,
      viewerContextTag: viewer.contextTag,
      candidateContextTag: row.context_tag as FeedContextTag,
      viewerEmotionalTag: viewer.emotionalTag,
      candidateEmotionalTag: candidateEmotional,
      viewerStateText: viewer.stateText,
      candidateStateText: row.daily_state_text?.trim() ?? "",
      viewerCaption: viewer.caption,
      candidateCaption: row.caption?.trim() ?? "",
    });

    if (score < SIMILAR_STORY_MIN_SCORE) {
      continue;
    }

    ranked.push({
      postId: row.id,
      score,
      contextTag: row.context_tag as FeedContextTag,
      excerpt: anonymizeExcerpt(row.caption, row.daily_state_text),
      emotionalStateTag: candidateEmotional,
      sharedSignals,
      createdAt: row.created_at,
    });
  }

  return ranked.sort((left, right) => right.score - left.score).slice(0, 5);
}

async function maybeEnhanceEmpathyWithAi(input: {
  matchCount: number;
  dominantTransitLabel: string | null;
  contextTagLabel: string | null;
  sharedSignals: string[];
}): Promise<string | null> {
  if (!process.env.KIE_API_KEY?.trim()) {
    return null;
  }

  const fallback = buildDeterministicEmpathyInsight(input);

  try {
    const response = await callKieChat(
      [
        {
          role: "system",
          content:
            "Sen AstroTag Benzer Hikayeler empatik anlatıcısısın. Türkçe, kısa (max 2 cümle), sıcak ama abartısız yaz. Ticari CTA yok.",
        },
        {
          role: "user",
          content: [
            `Eşleşen ruh sayısı: ${input.matchCount}`,
            input.dominantTransitLabel
              ? `Baskın transit: ${input.dominantTransitLabel}`
              : null,
            input.contextTagLabel ? `Bağlam: ${input.contextTagLabel}` : null,
            input.sharedSignals.length
              ? `Ortak sinyaller: ${input.sharedSignals.join(", ")}`
              : null,
            `Şablon: ${fallback}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      { temperature: 0.6, max_tokens: 120 }
    );

    const trimmed = response?.trim();
    return trimmed && trimmed.length >= 20 ? trimmed : null;
  } catch {
    return null;
  }
}

export async function findSimilarStoriesForViewer(
  profileId: string
): Promise<ViewerSimilarStoriesBundle | null> {
  const viewer = await loadViewerContext(profileId);
  if (!viewer) {
    return null;
  }

  const candidates = await loadCandidatePool(profileId);
  const matches = rankCandidates(viewer, candidates);

  const dominantTransitLabel = viewer.matchingSnapshot?.dominantTransitLabel ?? null;
  const contextTagLabel = viewer.contextTag
    ? feedContextTagLabel(viewer.contextTag)
    : matches[0]
      ? feedContextTagLabel(matches[0].contextTag)
      : null;

  const sharedSignals = matches.flatMap((match) => match.sharedSignals).slice(0, 4);

  const deterministic = buildDeterministicEmpathyInsight({
    matchCount: matches.length,
    dominantTransitLabel,
    contextTagLabel,
  });

  const aiInsight = await maybeEnhanceEmpathyWithAi({
    matchCount: matches.length,
    dominantTransitLabel,
    contextTagLabel,
    sharedSignals,
  });

  return {
    empathyInsight: aiInsight ?? deterministic,
    sharedLoopLabel: "Ortak Döngü",
    matchCount: matches.length,
    matches,
    viewerHasCosmicProfile: viewer.hasRealCosmicProfile,
  };
}

export async function buildSimilarStoryHintsForPosts(
  viewerProfileId: string,
  postIds: string[]
): Promise<Map<string, SimilarStoryHint>> {
  const result = new Map<string, SimilarStoryHint>();
  if (postIds.length === 0) {
    return result;
  }

  const viewer = await loadViewerContext(viewerProfileId);
  if (!viewer) {
    return result;
  }

  const admin = createServiceRoleClient();
  const { data: posts } = await admin
    .from("expert_feed")
    .select(
      "id, user_profile_id, caption, context_tag, cosmic_snapshot, daily_state_text, emotional_state_tag, created_at"
    )
    .in("id", postIds)
    .eq("content_type", "user_post")
    .neq("user_profile_id", viewerProfileId);

  if (!posts?.length) {
    return result;
  }

  const pool = await loadCandidatePool(viewerProfileId);

  for (const post of posts) {
    if (!post.context_tag || !isFeedContextTag(post.context_tag)) {
      continue;
    }

    const postSnapshot = resolveFeedCosmicSnapshot(
      post.cosmic_snapshot,
      post.context_tag
    );
    const postEmotional =
      post.emotional_state_tag && isEmotionalStateTag(post.emotional_state_tag)
        ? post.emotional_state_tag
        : null;

    let matchCount = 0;
    let bestExcerpt: string | null = null;
    let bestScore = 0;
    let dominantLabel =
      postSnapshot?.dominantTransitLabel ??
      viewer.matchingSnapshot?.dominantTransitLabel ??
      null;

    for (const candidate of pool) {
      if (candidate.id === post.id) {
        continue;
      }

      const candidateSnapshot = resolveFeedCosmicSnapshot(
        candidate.cosmic_snapshot,
        candidate.context_tag as FeedContextTag
      );
      const candidateEmotional =
        candidate.emotional_state_tag &&
        isEmotionalStateTag(candidate.emotional_state_tag)
          ? candidate.emotional_state_tag
          : null;

      const { score } = scoreSimilarStoryMatch({
        viewerSnapshot: postSnapshot ?? viewer.matchingSnapshot,
        candidateSnapshot,
        viewerContextTag: post.context_tag,
        candidateContextTag: candidate.context_tag as FeedContextTag,
        viewerEmotionalTag: postEmotional,
        candidateEmotionalTag: candidateEmotional,
        viewerStateText: post.daily_state_text?.trim() ?? "",
        candidateStateText: candidate.daily_state_text?.trim() ?? "",
        viewerCaption: post.caption?.trim() ?? "",
        candidateCaption: candidate.caption?.trim() ?? "",
      });

      if (score >= SIMILAR_STORY_MIN_SCORE) {
        matchCount += 1;
        if (score > bestScore) {
          bestScore = score;
          bestExcerpt = anonymizeExcerpt(candidate.caption, candidate.daily_state_text);
        }
      }
    }

    if (matchCount <= 0) {
      continue;
    }

    const empathyLine = buildDeterministicEmpathyInsight({
      matchCount,
      dominantTransitLabel: dominantLabel,
      contextTagLabel: feedContextTagLabel(post.context_tag),
    });

    result.set(post.id, {
      matchCount,
      empathyLine,
      topMatchExcerpt: bestExcerpt,
    });
  }

  return result;
}

export async function upsertUserDailyState(input: {
  profileId: string;
  stateText: string | null;
  emotionalStateTag: EmotionalStateTag | null;
  contextTag: FeedContextTag;
  cosmicSnapshot: FeedCosmicSnapshot | null;
  feedPostId: string;
}): Promise<void> {
  const admin = createServiceRoleClient();
  const stateDate = getIstanbulDateKey();

  await admin.from("user_daily_states").upsert(
    {
      profile_id: input.profileId,
      state_date: stateDate,
      state_text: input.stateText,
      emotional_state_tag: input.emotionalStateTag,
      context_tag: input.contextTag,
      cosmic_snapshot: input.cosmicSnapshot,
      feed_post_id: input.feedPostId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,state_date" }
  );
}
