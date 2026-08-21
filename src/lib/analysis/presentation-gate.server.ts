import type { OracleAnalysisPresentation } from "@/lib/analysis/types";

/** İstemciye gönderilecek sunum — premium detaylar varsayılan olarak gizli */
export function toClientOraclePresentation(
  presentation: OracleAnalysisPresentation,
  options?: { includeDetails?: boolean }
): OracleAnalysisPresentation {
  const includeDetails = options?.includeDetails ?? !presentation.isPremium;

  if (includeDetails || !presentation.isPremium) {
    return presentation;
  }

  return {
    ...presentation,
    details: "",
  };
}
