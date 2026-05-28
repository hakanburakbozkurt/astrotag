import type { UserData } from "@/types/user";
import type { AstrologyInterpretationResponse } from "@/lib/ai/astrology-interpretation";

export async function fetchNatalInterpretation(
  userData: UserData
): Promise<AstrologyInterpretationResponse> {
  const response = await fetch("/api/ai/natal-interpretation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userData }),
  });

  const data = (await response.json()) as AstrologyInterpretationResponse & {
    error?: string;
  };

  if (!response.ok || !data.interpretation?.trim()) {
    throw new Error(data.error ?? "Astroloji yorumu alınamadı.");
  }

  return { interpretation: data.interpretation };
}
