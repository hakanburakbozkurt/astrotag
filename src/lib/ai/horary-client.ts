import { runHoraryReading } from "@/lib/actions/horary-reading";
import type { HoraryResponse } from "@/lib/ai/horary";

/**
 * @deprecated Doğrudan `runHoraryReading` server action kullanın.
 */
export async function fetchHoraryReading(
  question: string
): Promise<HoraryResponse> {
  const result = await runHoraryReading(question);

  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    answer: result.answer,
  };
}
