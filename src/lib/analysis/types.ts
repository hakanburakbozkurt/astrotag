/** Standart Oracle analiz sunumu — tüm modüller bu formata map edilir */
export type OracleAnalysisPresentation = {
  executiveSummary: string;
  details: string;
  isPremium: boolean;
  cost: number;
};

export type AnalysisUiStatus = "idle" | "loading" | "ready" | "error";

export function formatPresentationForArchive(
  presentation: OracleAnalysisPresentation
): string {
  return `${presentation.executiveSummary.trim()}\n\n${presentation.details.trim()}`;
}
