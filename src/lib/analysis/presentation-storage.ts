import type { OracleAnalysisPresentation } from "@/lib/analysis/types";
import { parseOracleAnalysisFromJson } from "@/lib/analysis/parse-oracle-response";

const STORED_PRESENTATION_KEYS = ["executiveSummary", "details"] as const;

export function serializeOraclePresentation(
  presentation: Pick<OracleAnalysisPresentation, "executiveSummary" | "details">
): string {
  return JSON.stringify({
    executiveSummary: presentation.executiveSummary,
    details: presentation.details,
  });
}

export function deserializeOraclePresentation(
  raw: string,
  options: { cost: number; isPremium: boolean }
): OracleAnalysisPresentation | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const hasShape = STORED_PRESENTATION_KEYS.every(
      (key) => typeof parsed[key] === "string" && String(parsed[key]).trim().length > 0
    );

    if (hasShape) {
      return {
        executiveSummary: String(parsed.executiveSummary).trim(),
        details: String(parsed.details).trim(),
        isPremium: options.isPremium,
        cost: options.cost,
      };
    }
  } catch {
    // legacy düz metin
  }

  return parseOracleAnalysisFromJson(trimmed, {
    cost: options.cost,
    isPremium: options.isPremium,
    fallbackDetails: trimmed,
  });
}
