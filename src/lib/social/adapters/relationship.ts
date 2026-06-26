import type { RelationshipAnalysisSlice } from "@/lib/astrology/analysis-context/types";
import type { SocialSharePayload } from "../types";

export function relationshipSliceToSharePayload(
  slice: RelationshipAnalysisSlice
): SocialSharePayload {
  const dateLabel = new Date(slice.askedAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const shareText = [
    "✦ AstroTag · İlişki Uyumu",
    `${slice.userName} × ${slice.partnerName}`,
    `${slice.scoreLabel}: ${slice.score}/100`,
    "",
    slice.summary,
    "",
    "→ https://astro-tag.app",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    templateId: "relationship-synastry",
    module: "relationship",
    eyebrow: "ASTROTAG · SYNastry",
    title: `${slice.userName} × ${slice.partnerName}`,
    subtitle: slice.scoreLabel,
    score: {
      value: slice.score,
      label: slice.scoreLabel,
      max: 100,
    },
    body: slice.summary,
    excerpt: slice.aiExcerpt ?? slice.question,
    metaLine: slice.question ? `Soru: ${slice.question}` : undefined,
    shareText,
    dateLabel,
  };
}

/** Mevut SynastryShareCardData ile geriye dönük uyumluluk. */
export function synastryCardDataToSharePayload(data: {
  userName: string;
  partnerName: string;
  score: number;
  summary: string;
  date: string;
  question?: string;
  analysisExcerpt?: string;
}): SocialSharePayload {
  const shareText = [
    "✦ AstroTag · İlişki Uyumu",
    `${data.userName} × ${data.partnerName}`,
    `Uyum Skoru: ${data.score}/100`,
    "",
    data.summary,
    data.analysisExcerpt ? `\n${data.analysisExcerpt}` : "",
    "",
    "→ https://astro-tag.app",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    templateId: "relationship-synastry",
    module: "relationship",
    eyebrow: "ASTROTAG · SYNastry",
    title: `${data.userName} × ${data.partnerName}`,
    subtitle: "Uyum Skoru",
    score: { value: data.score, label: "Uyum Skoru", max: 100 },
    body: data.summary,
    excerpt: data.analysisExcerpt ?? data.question,
    metaLine: data.question ? `Soru: ${data.question}` : undefined,
    shareText,
    dateLabel: data.date,
  };
}
