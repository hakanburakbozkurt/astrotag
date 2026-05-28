import type { UserData } from "@/types/user";
import type { AITarotResponse } from "@/lib/ai/tarot";
import { TAROT_CACHE_HOURS } from "@/lib/constants/cosmic";
import {
  getAuthUserId,
  getCachedTarotReading,
  saveTarotHistory,
} from "@/lib/supabase-actions";

export async function fetchTarotReading(
  question: string,
  userData: UserData,
  cardIds: string[]
): Promise<AITarotResponse> {
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
    body: JSON.stringify({ question, userData, cardIds }),
  });

  const data = (await response.json()) as AITarotResponse & { error?: string };

  if (!response.ok || !data.reading?.trim()) {
    throw new Error(data.error ?? "Tarot request failed");
  }

  await saveTarotHistory({
    userId,
    question,
    cardIds,
    reading: data.reading,
  });

  return {
    reading: data.reading,
    cached: false,
  };
}
