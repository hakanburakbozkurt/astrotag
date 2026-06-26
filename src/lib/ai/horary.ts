import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import {
  HORARY_PIPELINE_FALLBACK,
  runHoraryReadingPipeline,
} from "@/lib/ai/horary-pipeline";
import type { PipelineLogContext } from "@/lib/cosmic-journal/log-reading";
import type { UserData } from "@/types/user";

export const HORARY_ERROR_MESSAGE = HORARY_PIPELINE_FALLBACK;

export interface HoraryResponse {
  answer: string;
  cosmicContext?: CosmicAnalysisContext;
}

export class HoraryReadingError extends Error {
  constructor(message: string = HORARY_ERROR_MESSAGE) {
    super(message);
    this.name = "HoraryReadingError";
  }
}

/**
 * Horary yorumu — Emph motoru + Kie medyum pipeline.
 */
export async function requestHoraryReading(
  question: string,
  userData: UserData,
  options?: { logContext?: PipelineLogContext }
): Promise<HoraryResponse> {
  const result = await runHoraryReadingPipeline(
    question,
    userData,
    options?.logContext
  );

  if (!result) {
    throw new HoraryReadingError(HORARY_ERROR_MESSAGE);
  }

  return {
    answer: result.answer,
    cosmicContext: result.cosmicContext,
  };
}
