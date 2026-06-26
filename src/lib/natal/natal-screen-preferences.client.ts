import type { NatalChartViewMode } from "@/lib/astrology/types";

export type NatalScreenSection = "chart" | "weekly";

export interface NatalScreenPreferences {
  section: NatalScreenSection;
  chartViewMode: NatalChartViewMode;
}

const STORAGE_KEY = "astrotag-natal-screen-preferences";

const DEFAULT_PREFERENCES: NatalScreenPreferences = {
  section: "chart",
  chartViewMode: "classic",
};

function isSection(value: unknown): value is NatalScreenSection {
  return value === "chart" || value === "weekly";
}

function isChartViewMode(value: unknown): value is NatalChartViewMode {
  return value === "classic" || value === "master";
}

export function readNatalScreenPreferences(): NatalScreenPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<NatalScreenPreferences>;
    return {
      section: isSection(parsed.section) ? parsed.section : DEFAULT_PREFERENCES.section,
      chartViewMode: isChartViewMode(parsed.chartViewMode)
        ? parsed.chartViewMode
        : DEFAULT_PREFERENCES.chartViewMode,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writeNatalScreenPreferences(
  preferences: NatalScreenPreferences
): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
