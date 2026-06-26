import type { AnalysisModuleId } from "@/lib/astrology/analysis-context/types";

export type SocialShareTemplateId =
  | "natal-classic"
  | "weekly-transit"
  | "relationship-synastry";

export interface SocialShareScoreBlock {
  value: number;
  label: string;
  max?: number;
}

export interface SocialShareAspectStroke {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  progress?: number;
}

/** AnalysisContext / modül adapter çıktısı — şablon agnostik. */
export interface SocialSharePayload {
  templateId: SocialShareTemplateId;
  module: AnalysisModuleId;
  eyebrow: string;
  title: string;
  subtitle?: string;
  score?: SocialShareScoreBlock;
  body: string;
  excerpt?: string;
  metaLine?: string;
  shareText: string;
  dateLabel: string;
}

/** ChartEngine DOM'dan html-to-image ile üretilen raster. */
export interface SocialShareChartRaster {
  dataUrl: string;
  width: number;
  height: number;
}

export interface SocialShareRenderInput {
  payload: SocialSharePayload;
  chart: SocialShareChartRaster;
}

export interface SocialShareVideoInput extends SocialShareRenderInput {
  durationMs?: number;
  aspectStrokes?: SocialShareAspectStroke[];
  typingText?: string;
}

export interface SocialShareAsset {
  blob: Blob;
  mimeType: string;
  fileName: string;
  shareText: string;
}

export interface SocialShareResult {
  image: SocialShareAsset;
  video?: SocialShareAsset;
}

export type ChartCaptureFn = () => Promise<SocialShareChartRaster>;
