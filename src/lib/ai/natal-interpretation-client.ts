import type { AstrologyInterpretationResponse } from "@/lib/ai/astrology-interpretation";

export type NatalInterpretationResponse = AstrologyInterpretationResponse & {
  cached?: boolean;
  remainingStars?: number;
};

export async function fetchNatalInterpretation(): Promise<NatalInterpretationResponse> {
  const response = await fetch("/api/ai/natal-interpretation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const data = (await response.json()) as NatalInterpretationResponse & {
    error?: string;
  };

  if (
    !response.ok ||
    !data.presentation?.executiveSummary?.trim() ||
    !data.presentation?.details?.trim()
  ) {
    throw new Error(data.error ?? "Astroloji yorumu alınamadı.");
  }

  return {
    presentation: data.presentation,
    interpretation: data.interpretation?.trim() || data.presentation.details,
    cached: data.cached ?? false,
    remainingStars: data.remainingStars,
  };
}
