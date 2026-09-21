import type { FeedContextTag } from "@/lib/feed/feed-context-tags.shared";

export const EMOTIONAL_STATE_TAGS = [
  "overwhelmed",
  "hopeful",
  "restless",
  "grieving",
  "transforming",
  "seeking",
  "grounded",
  "volatile",
] as const;

export type EmotionalStateTag = (typeof EMOTIONAL_STATE_TAGS)[number];

const EMOTIONAL_STATE_LABELS: Record<EmotionalStateTag, string> = {
  overwhelmed: "Bunalmış",
  hopeful: "Umutlu",
  restless: "Huzursuz",
  grieving: "Yaslı",
  transforming: "Dönüşümde",
  seeking: "Arayışta",
  grounded: "Topraklanmış",
  volatile: "Dalgalı",
};

export const DAILY_STATE_MAX_LENGTH = 140;

export const SIMILAR_STORY_MIN_SCORE = 35;
export const SIMILAR_STORY_MATCH_WINDOW_DAYS = 7;

export type FeedCosmicSnapshot = {
  capturedAt: string;
  natal: {
    sunSign: string;
    moonSign: string;
    risingSign: string;
  };
  sky: {
    moonSign: string;
  };
  tensionIds: string[];
  transitAspectKeys: string[];
  dominantTransitLabel: string | null;
};

export type SimilarStoryMatch = {
  postId: string;
  score: number;
  contextTag: FeedContextTag;
  excerpt: string;
  emotionalStateTag: EmotionalStateTag | null;
  sharedSignals: string[];
  createdAt: string;
};

export type SimilarStoryHint = {
  matchCount: number;
  empathyLine: string;
  topMatchExcerpt: string | null;
};

export type ViewerSimilarStoriesBundle = {
  empathyInsight: string;
  sharedLoopLabel: string;
  matchCount: number;
  matches: SimilarStoryMatch[];
  viewerHasCosmicProfile: boolean;
};

export function isEmotionalStateTag(value: string): value is EmotionalStateTag {
  return (EMOTIONAL_STATE_TAGS as readonly string[]).includes(value);
}

export function emotionalStateTagLabel(tag: EmotionalStateTag): string {
  return EMOTIONAL_STATE_LABELS[tag];
}

export function parseFeedCosmicSnapshot(value: unknown): FeedCosmicSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const natal = row.natal;
  const sky = row.sky;

  if (!natal || typeof natal !== "object" || Array.isArray(natal)) {
    return null;
  }
  if (!sky || typeof sky !== "object" || Array.isArray(sky)) {
    return null;
  }

  const natalRow = natal as Record<string, unknown>;
  const skyRow = sky as Record<string, unknown>;

  const sunSign = typeof natalRow.sunSign === "string" ? natalRow.sunSign.trim() : "";
  const moonSign = typeof natalRow.moonSign === "string" ? natalRow.moonSign.trim() : "";
  const risingSign =
    typeof natalRow.risingSign === "string" ? natalRow.risingSign.trim() : "";
  const skyMoonSign =
    typeof skyRow.moonSign === "string" ? skyRow.moonSign.trim() : "";

  if (!sunSign || !moonSign || !skyMoonSign) {
    return null;
  }

  const tensionIds = Array.isArray(row.tensionIds)
    ? row.tensionIds.filter((item): item is string => typeof item === "string")
    : [];

  const transitAspectKeys = Array.isArray(row.transitAspectKeys)
    ? row.transitAspectKeys.filter((item): item is string => typeof item === "string")
    : [];

  const dominantTransitLabel =
    typeof row.dominantTransitLabel === "string" && row.dominantTransitLabel.trim()
      ? row.dominantTransitLabel.trim()
      : null;

  const capturedAt =
    typeof row.capturedAt === "string" && row.capturedAt.trim()
      ? row.capturedAt
      : new Date().toISOString();

  return {
    capturedAt,
    natal: { sunSign, moonSign, risingSign: risingSign || moonSign },
    sky: { moonSign: skyMoonSign },
    tensionIds,
    transitAspectKeys,
    dominantTransitLabel,
  };
}

function tokenizeText(text: string): Set<string> {
  return new Set(
    text
      .toLocaleLowerCase("tr-TR")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
  );
}

export function textOverlapRatio(left: string, right: string): number {
  const a = tokenizeText(left);
  const b = tokenizeText(right);
  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of a) {
    if (b.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.min(a.size, b.size);
}

function overlapCount(left: string[], right: string[]): number {
  const set = new Set(left);
  return right.filter((item) => set.has(item)).length;
}

export function scoreSimilarStoryMatch(input: {
  viewerSnapshot: FeedCosmicSnapshot | null;
  candidateSnapshot: FeedCosmicSnapshot | null;
  viewerContextTag: FeedContextTag | null;
  candidateContextTag: FeedContextTag;
  viewerEmotionalTag: EmotionalStateTag | null;
  candidateEmotionalTag: EmotionalStateTag | null;
  viewerStateText: string;
  candidateStateText: string;
  viewerCaption: string;
  candidateCaption: string;
}): { score: number; sharedSignals: string[] } {
  const sharedSignals: string[] = [];
  let score = 0;

  if (
    input.viewerContextTag &&
    input.viewerContextTag === input.candidateContextTag
  ) {
    score += 30;
    sharedSignals.push("Aynı bağlam etiketi");
  }

  if (
    input.viewerEmotionalTag &&
    input.viewerEmotionalTag === input.candidateEmotionalTag
  ) {
    score += 18;
    sharedSignals.push("Benzer duygusal hal");
  }

  const stateOverlap = textOverlapRatio(
    input.viewerStateText,
    input.candidateStateText
  );
  if (stateOverlap >= 0.25) {
    score += Math.round(stateOverlap * 15);
    sharedSignals.push("Günlük hal yankısı");
  }

  const captionOverlap = textOverlapRatio(
    input.viewerCaption,
    input.candidateCaption
  );
  if (captionOverlap >= 0.2) {
    score += Math.round(captionOverlap * 20);
    sharedSignals.push("Metin yakınlığı");
  }

  if (input.viewerSnapshot && input.candidateSnapshot) {
    const viewer = input.viewerSnapshot;
    const candidate = input.candidateSnapshot;

    const tensionOverlap = overlapCount(viewer.tensionIds, candidate.tensionIds);
    if (tensionOverlap > 0) {
      score += tensionOverlap * 22;
      sharedSignals.push("Ortak kozmik gerilim");
    }

    const aspectOverlap = overlapCount(
      viewer.transitAspectKeys,
      candidate.transitAspectKeys
    );
    if (aspectOverlap > 0) {
      score += aspectOverlap * 18;
      sharedSignals.push("Aynı transit imzası");
    }

    if (viewer.sky.moonSign === candidate.sky.moonSign) {
      score += 12;
      sharedSignals.push("Aynı gökyüzü Ay'ı");
    }

    if (viewer.natal.moonSign === candidate.natal.moonSign) {
      score += 10;
      sharedSignals.push("Aynı natal Ay");
    }

    if (viewer.natal.sunSign === candidate.natal.sunSign) {
      score += 8;
      sharedSignals.push("Aynı Güneş burcu");
    }
  }

  return { score, sharedSignals: [...new Set(sharedSignals)] };
}

export function buildDeterministicEmpathyInsight(input: {
  matchCount: number;
  dominantTransitLabel: string | null;
  contextTagLabel: string | null;
}): string {
  const count = input.matchCount;
  if (count <= 0) {
    return "Henüz aynı gökyüzü altında yankı bulan bir hikâye yok — ilk paylaşım sizden gelebilir.";
  }

  const skyPhrase = input.dominantTransitLabel
    ? `benzer bir ${input.dominantTransitLabel} geçişini`
    : input.contextTagLabel
      ? `${input.contextTagLabel.toLowerCase()} bağlamında benzer bir döngüyü`
      : "benzer bir kozmik döngüyü";

  if (count === 1) {
    return `Şu anda 1 ruh aynı gökyüzü altında ${skyPhrase} taşıyor. Yalnız değilsin.`;
  }

  return `Şu anda ${count} ruh aynı gökyüzü altında ${skyPhrase} taşıyor. Yalnız değilsin.`;
}
