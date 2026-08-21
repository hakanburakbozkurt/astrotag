import type {
  SynastryAnalyzeResponse,
  SynastryScoreResponse,
} from "@/lib/ai/synastry";
import { formatPresentationForArchive } from "@/lib/analysis/types";

export type SynastryScoreClientResponse = SynastryScoreResponse & {
  cached?: boolean;
};

export type SynastryAnalyzeClientResponse = SynastryAnalyzeResponse & {
  remainingStars?: number;
};

export async function fetchSynastryScore(): Promise<SynastryScoreClientResponse> {
  const response = await fetch("/api/ai/compatibility/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const data = (await response.json()) as SynastryScoreClientResponse & {
    error?: string;
  };

  if (!response.ok || !Number.isFinite(data.score)) {
    throw new Error(data.error ?? "Uyum skoru alınamadı.");
  }

  return data;
}

export async function fetchSynastryAnalysis(
  question: string,
  options?: {
    compatibilityScore?: number;
  }
): Promise<SynastryAnalyzeClientResponse> {
  const response = await fetch("/api/ai/compatibility/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      compatibilityScore: options?.compatibilityScore,
    }),
  });

  const data = (await response.json()) as SynastryAnalyzeClientResponse & {
    error?: string;
  };

  if (
    !response.ok ||
    !data.presentation?.executiveSummary?.trim() ||
    !data.presentation?.details?.trim()
  ) {
    throw new Error(data.error ?? "Synastry analizi alınamadı.");
  }

  return {
    ...data,
    analysis: data.analysis?.trim() || formatPresentationForArchive(data.presentation),
  };
}
