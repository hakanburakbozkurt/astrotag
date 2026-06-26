import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import type { UserData } from "@/types/user";
import type { HoraryResponse } from "@/lib/ai/horary";

export async function fetchHoraryReading(
  question: string,
  userData: UserData
): Promise<HoraryResponse & { cosmicContext?: CosmicAnalysisContext }> {
  const response = await fetch("/api/ai/horary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, userData }),
  });

  const data = (await response.json()) as HoraryResponse & {
    error?: string;
    cosmicContext?: CosmicAnalysisContext;
  };

  if (!response.ok || !data.answer?.trim()) {
    throw new Error(data.error ?? "Horary request failed");
  }

  return {
    answer: data.answer,
    cosmicContext: data.cosmicContext,
  };
}
