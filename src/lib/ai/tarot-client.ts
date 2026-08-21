import { TAROT_CACHE_HOURS } from "@/lib/constants/cosmic";
import {
  getAuthUserId,
  getCachedTarotReading,
  saveTarotHistory,
} from "@/lib/supabase-actions";

export async function fetchTarotReading(
  question: string,
  cardIds: string[]
): Promise<{ reading: string; cached: boolean }> {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("Oturum bulunamadı.");
  }

  const cached = await getCachedTarotReading(userId, cardIds, TAROT_CACHE_HOURS);
  if (cached) {
    return { reading: cached, cached: true };
  }

  const response = await fetch("/api/ai/tarot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, cardIds }),
  });

  const data = (await response.json()) as {
    reading?: string;
    presentation?: { executiveSummary?: string };
    error?: string;
  };

  const reading =
    data.reading?.trim() ??
    data.presentation?.executiveSummary?.trim() ??
    "";

  if (!response.ok || !reading) {
    throw new Error(data.error ?? "Tarot request failed");
  }

  await saveTarotHistory({
    userId,
    question,
    cardIds,
    reading,
  });

  return {
    reading,
    cached: false,
  };
}
