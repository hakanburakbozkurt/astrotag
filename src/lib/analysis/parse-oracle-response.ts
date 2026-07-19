import type { OracleAnalysisPresentation } from "@/lib/analysis/types";

type OracleAnalysisJson = {
  executiveSummary?: string;
  details?: string;
};

export function splitLegacyAnalysisText(raw: string): {
  executiveSummary: string;
  details: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { executiveSummary: "", details: "" };
  }

  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    const sentenceMatch = trimmed.match(/^(.+?[.!?…](?:\s|$))([\s\S]*)$/);
    if (sentenceMatch) {
      const summary = sentenceMatch[1].trim();
      const rest = sentenceMatch[2].trim();
      return {
        executiveSummary: summary,
        details: rest || summary,
      };
    }

    return { executiveSummary: trimmed, details: trimmed };
  }

  return {
    executiveSummary: paragraphs[0] ?? trimmed,
    details: paragraphs.slice(1).join("\n\n") || (paragraphs[0] ?? trimmed),
  };
}

export function parseOracleAnalysisFromJson(
  raw: string,
  options: {
    cost: number;
    isPremium: boolean;
    fallbackDetails?: string;
  }
): OracleAnalysisPresentation {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as OracleAnalysisJson;
      const executiveSummary =
        parsed.executiveSummary?.trim() ||
        splitLegacyAnalysisText(options.fallbackDetails ?? raw).executiveSummary;
      const details =
        parsed.details?.trim() ||
        options.fallbackDetails?.trim() ||
        splitLegacyAnalysisText(raw).details;

      return {
        executiveSummary,
        details,
        isPremium: options.isPremium,
        cost: options.cost,
      };
    } catch {
      // fall through to legacy split
    }
  }

  const legacy = splitLegacyAnalysisText(options.fallbackDetails ?? raw);

  return {
    executiveSummary: legacy.executiveSummary,
    details: legacy.details,
    isPremium: options.isPremium,
    cost: options.cost,
  };
}
