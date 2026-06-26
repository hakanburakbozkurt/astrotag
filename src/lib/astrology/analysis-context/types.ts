import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";
import type { NatalChartSummary } from "@/lib/astrology/types";
import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import type { WeeklyAnalysisContent } from "@/lib/cosmic-radar/types";

/** Modül kimliği — AI danışmanlık ve paylaşım şablonları ortak SSOT. */
export type AnalysisModuleId =
  | "natal"
  | "weekly"
  | "relationship"
  | "career";

export type AnalysisPerspectiveMode = "natal-fixed" | "whole-sign";

export interface AnalysisPerspective {
  ascendantDegree: number;
  mode: AnalysisPerspectiveMode;
  selectedSign?: ZodiacSign;
}

export interface BaseAnalysisSlice {
  module: AnalysisModuleId;
  askedAt: string;
  perspective: AnalysisPerspective;
  natal: NatalChartSummary;
}

export interface RelationshipAnalysisSlice extends BaseAnalysisSlice {
  module: "relationship";
  userName: string;
  partnerName: string;
  score: number;
  scoreLabel: string;
  summary: string;
  question?: string;
  aiExcerpt?: string;
}

export interface WeeklyAnalysisSlice extends BaseAnalysisSlice {
  module: "weekly";
  selectedSign: ZodiacSign;
  content: WeeklyAnalysisContent;
}

export interface NatalAnalysisSlice extends BaseAnalysisSlice {
  module: "natal";
  interpretation?: string;
}

export interface CareerAnalysisSlice extends BaseAnalysisSlice {
  module: "career";
  focusTitle: string;
  aiExcerpt: string;
}

export type AnalysisModuleSlice =
  | RelationshipAnalysisSlice
  | WeeklyAnalysisSlice
  | NatalAnalysisSlice
  | CareerAnalysisSlice;

/** Mevcut CosmicAnalysisContext ile modül dilimi birlikte taşınır. */
export interface AnalysisContextEnvelope {
  cosmic: CosmicAnalysisContext;
  slice: AnalysisModuleSlice;
}
