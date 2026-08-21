import type { NexusDailyResponse } from "@/lib/ai/nexus";

export type NexusDailyClientResponse = NexusDailyResponse & {
  cached?: boolean;
};

export async function fetchNexusDaily(): Promise<NexusDailyClientResponse> {
  const response = await fetch("/api/ai/nexus/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const data = (await response.json()) as NexusDailyClientResponse & {
    error?: string;
  };

  if (!response.ok || !data.userDay?.trim()) {
    throw new Error(data.error ?? "Nexus günlük yorumları alınamadı.");
  }

  return data;
}
