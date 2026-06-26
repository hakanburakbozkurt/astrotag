import { buildRelationshipAnalysisSlice } from "@/lib/astrology/analysis-context/modules/relationship";
import { longitudeToSign } from "@/lib/astrology/zodiac";
import type { NatalChartSummary } from "@/lib/astrology/types";
import { relationshipSliceToSharePayload } from "./relationship";
import type { SocialSharePayload } from "../types";

export interface SynastryBondsShareInput {
  userName: string;
  partnerName: string;
  score: number;
  summary: string;
  date: string;
  userAscendantDegree: number;
  question?: string;
  analysisExcerpt?: string;
  scoreLabel?: string;
}

function minimalNatalSummary(ascendantDegree: number): NatalChartSummary {
  const asc = longitudeToSign(ascendantDegree);

  return {
    meta: {
      birthUtc: "",
      birthPlace: "",
      latitude: 0,
      longitude: 0,
      timezone: "",
    },
    ascendant: {
      longitude: ascendantDegree,
      signIndex: asc.signIndex,
      signName: asc.signName,
      degreeInSign: asc.degreeInSign,
      label: asc.label,
    },
    planets: [],
    aspects: [],
    houses: [],
  };
}

/** Bonds/Synastry ekranı → SocialSharePayload (score SSOT: synastry-score-engine). */
export function buildSynastryBondsSharePayload(
  input: SynastryBondsShareInput
): SocialSharePayload {
  const slice = buildRelationshipAnalysisSlice({
    askedAt: new Date(),
    natal: minimalNatalSummary(input.userAscendantDegree),
    ascendantDegree: input.userAscendantDegree,
    userName: input.userName,
    partnerName: input.partnerName,
    score: input.score,
    scoreLabel: input.scoreLabel ?? "Uyum Skoru",
    summary: input.summary,
    question: input.question,
    aiExcerpt: input.analysisExcerpt,
  });

  const payload = relationshipSliceToSharePayload(slice);
  return {
    ...payload,
    dateLabel: input.date,
  };
}
