import { parseOracleAnalysisFromJson } from "@/lib/analysis/parse-oracle-response";
import { deserializeOraclePresentation } from "@/lib/analysis/presentation-storage";
import type { OracleAnalysisPresentation } from "@/lib/analysis/types";

/** Arşiv kayıtları — detaylar önceden açılmış sayılır, yıldız tüketimi yok */
const ARCHIVE_PRESENTATION_OPTIONS = {
  cost: 0,
  isPremium: false,
} as const;

export function parseArchiveReadingPresentation(
  raw: string
): OracleAnalysisPresentation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      executiveSummary: "",
      details: "",
      ...ARCHIVE_PRESENTATION_OPTIONS,
    };
  }

  const deserialized = deserializeOraclePresentation(
    trimmed,
    ARCHIVE_PRESENTATION_OPTIONS
  );
  if (deserialized) {
    return deserialized;
  }

  return parseOracleAnalysisFromJson(trimmed, {
    ...ARCHIVE_PRESENTATION_OPTIONS,
    fallbackDetails: trimmed,
  });
}

export function getArchiveReadingPreview(raw: string, maxLength = 96): string {
  const { executiveSummary, details } = parseArchiveReadingPresentation(raw);
  const text = (executiveSummary || details).trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
