import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CosmicReadingType, SynastryReadingMeta } from "@/lib/cosmic-journal/types";

const COSMIC_READINGS_TABLE = "cosmic_readings";

export type { CosmicReadingType, SynastryReadingMeta };

export type PipelineLogContext = {
  userId: string;
};

export async function logCosmicReadingToArchive(input: {
  userId: string;
  type: CosmicReadingType;
  question: string;
  readingResult: string;
  cardsJson?: unknown | null;
}): Promise<void> {
  const question = input.question.trim();
  const readingResult = input.readingResult.trim();

  if (!input.userId || !question || !readingResult) {
    return;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from(COSMIC_READINGS_TABLE).insert({
      user_id: input.userId,
      type: input.type,
      question,
      reading_result: readingResult,
      cards_json: input.cardsJson ?? null,
    });

    if (error) {
      console.error("COSMIC_JOURNAL_LOG_ERROR:", error.message);
    }
  } catch (error) {
    console.error("COSMIC_JOURNAL_LOG_ERROR:", error);
  }
}

export async function logSynastryToArchive(input: {
  userId: string;
  question: string;
  analysis: string;
  partnerName: string;
  compatibilityScore: number;
}): Promise<void> {
  const question = input.question.trim();
  const analysis = input.analysis.trim();
  const partnerName = input.partnerName.trim();

  if (!input.userId || !question || !analysis || !partnerName) {
    return;
  }

  const meta: SynastryReadingMeta = {
    partner_name: partnerName,
    compatibility_score: Math.round(
      Number.isFinite(input.compatibilityScore) ? input.compatibilityScore : 0
    ),
    analysis,
  };

  await logCosmicReadingToArchive({
    userId: input.userId,
    type: "Synastry",
    question,
    readingResult: analysis,
    cardsJson: meta,
  });
}
