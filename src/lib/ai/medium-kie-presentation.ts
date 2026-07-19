import "server-only";

import { z } from "zod";
import {
  MediumParagraphSchema,
  formatMediumParagraphs,
  type MediumParagraphResponse,
} from "@/lib/ai/medium-kie";

/** AnalysisResults — çift katmanlı KIE JSON şeması */
export const OraclePresentationJsonSchema = z.object({
  executiveSummary: z.string().min(60).max(720),
  details: z.string().min(100).max(6000),
});

export type OraclePresentationJson = z.infer<typeof OraclePresentationJsonSchema>;

export function parseOraclePresentationJson(raw: string): OraclePresentationJson | null {
  const trimmed = raw.trim();

  const tryParse = (candidate: string): OraclePresentationJson | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      const result = OraclePresentationJsonSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) {
    return direct;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const fromFence = tryParse(fenced[1]);
    if (fromFence) {
      return fromFence;
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return tryParse(trimmed.slice(start, end + 1));
  }

  return null;
}

/** Legacy paragraph1/2/3 → details metni */
export function legacyParagraphsToDetails(paragraphs: MediumParagraphResponse): string {
  return formatMediumParagraphs(paragraphs);
}

/** Legacy yanıtı presentation'a yükselt (geçiş dönemi) */
export function presentationFromLegacyParagraphs(
  paragraphs: MediumParagraphResponse,
  executiveSummaryFallback?: string
): OraclePresentationJson {
  const details = legacyParagraphsToDetails(paragraphs);
  const firstSentence = details.match(/^(.+?[.!?…](?:\s|$))/);
  const executiveSummary =
    executiveSummaryFallback?.trim() ||
    (firstSentence ? firstSentence[1].trim() : details.slice(0, 220).trim());

  return {
    executiveSummary,
    details,
  };
}

export { MediumParagraphSchema, formatMediumParagraphs };
