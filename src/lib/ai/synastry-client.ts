import type { UserData } from "@/types/user";
import type {
  SynastryAnalyzeResponse,
  SynastryScoreResponse,
} from "@/lib/ai/synastry";
import { formatPresentationForArchive } from "@/lib/analysis/types";

export async function fetchSynastryScore(
  userData: UserData
): Promise<SynastryScoreResponse> {
  const response = await fetch("/api/ai/compatibility/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userData }),
  });

  const data = (await response.json()) as SynastryScoreResponse & {
    error?: string;
  };

  if (!response.ok || !Number.isFinite(data.score)) {
    throw new Error(data.error ?? "Uyum skoru alınamadı.");
  }

  return data;
}

export async function fetchSynastryAnalysis(
  question: string,
  userData: UserData,
  options?: {
    compatibilityScore?: number;
    partnerName?: string;
  }
): Promise<SynastryAnalyzeResponse> {
  const response = await fetch("/api/ai/compatibility/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      userData,
      compatibilityScore: options?.compatibilityScore,
      partnerName: options?.partnerName,
    }),
  });

  const data = (await response.json()) as SynastryAnalyzeResponse & {
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
