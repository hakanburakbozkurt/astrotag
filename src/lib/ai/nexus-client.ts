import type { NexusDailyResponse } from "@/lib/ai/nexus";
import type { UserData } from "@/types/user";

export async function fetchNexusDaily(userData: UserData): Promise<NexusDailyResponse> {
  const response = await fetch("/api/ai/nexus/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userData }),
  });

  const data = (await response.json()) as NexusDailyResponse & {
    error?: string;
  };

  if (!response.ok || !data.userDay?.trim()) {
    throw new Error(data.error ?? "Nexus günlük yorumları alınamadı.");
  }

  return data;
}
