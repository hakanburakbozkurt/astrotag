import { todayDateKeyLocal } from "@/lib/manifesto/daily-cosmic-seen.client";

const HIDDEN_KEY = "astrotag_cosmic_assistant_hidden";

export function isCosmicAssistantHiddenToday(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(HIDDEN_KEY) === todayDateKeyLocal();
}

export function hideCosmicAssistantForToday(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(HIDDEN_KEY, todayDateKeyLocal());
}
