import type { NatalChartSummary } from "@/lib/astrology/types";
import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import type { RelationshipAnalysisSlice } from "../types";

export interface BuildRelationshipSliceInput {
  askedAt?: Date;
  natal: NatalChartSummary;
  ascendantDegree: number;
  userName: string;
  partnerName: string;
  score: number;
  scoreLabel?: string;
  summary: string;
  question?: string;
  aiExcerpt?: string;
}

export function buildRelationshipAnalysisSlice(
  input: BuildRelationshipSliceInput
): RelationshipAnalysisSlice {
  return {
    module: "relationship",
    askedAt: (input.askedAt ?? new Date()).toISOString(),
    perspective: {
      ascendantDegree: input.ascendantDegree,
      mode: "natal-fixed",
    },
    natal: input.natal,
    userName: input.userName,
    partnerName: input.partnerName,
    score: input.score,
    scoreLabel: input.scoreLabel ?? "Uyum Skoru",
    summary: input.summary,
    question: input.question,
    aiExcerpt: input.aiExcerpt,
  };
}

export function relationshipSliceFromCosmicContext(
  cosmic: CosmicAnalysisContext,
  details: Omit<
    BuildRelationshipSliceInput,
    "askedAt" | "natal" | "ascendantDegree"
  > & { ascendantDegree?: number }
): RelationshipAnalysisSlice {
  return buildRelationshipAnalysisSlice({
    askedAt: new Date(cosmic.askedAt),
    natal: cosmic.natal,
    ascendantDegree:
      details.ascendantDegree ?? parseAscendantFromSummary(cosmic.natal),
    ...details,
  });
}

function parseAscendantFromSummary(summary: NatalChartSummary): number {
  return summary.ascendant.longitude;
}
