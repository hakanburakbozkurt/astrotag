import "server-only";

import type { EmphEnrichedPackage } from "@/lib/astrology/emph-processing-engine";
import { processTarotThroughEmph } from "@/lib/astrology/emph-processing-engine";
import {
  TAROT_READING_FALLBACK_MESSAGE,
} from "@/lib/ai/tarot-constants";
import { ORACLE_JSON_GUARDRAIL } from "@/lib/ai/oracle-guardrails";
import {
  MEDIUM_TAROT_SYSTEM_PROMPT,
} from "@/lib/ai/medium-persona";
import { requestMediumKieReading } from "@/lib/ai/medium-kie";
import {
  TarotPipelineInputSchema,
  type TarotPipelineInput,
  type TarotReadingCard,
} from "@/lib/ai/tarot-pipeline-schemas";
import type { PipelineLogContext } from "@/lib/cosmic-journal/log-reading";
import { logCosmicReadingToArchive } from "@/lib/cosmic-journal/log-reading";
import type { UserData } from "@/types/user";

const SPREAD_POSITIONS = ["Sol", "Orta", "Sağ"] as const;

function buildMediumUserPrompt(
  emphPackage: EmphEnrichedPackage
): string {
  return `${ORACLE_JSON_GUARDRAIL}

Aşağıdaki JSON, Emph ephemeris motorunun ürettiği GERÇEKLİK paketidir. Bunu tek kaynak kabul et; kart sembolizmi + natal harita etkisini birlikte oku.

EMPH PAKETİ (JSON):
${JSON.stringify(emphPackage, null, 2)}

Kullanıcı verileri: [${emphPackage.profile.userSummary}].
Partner verileri: [${emphPackage.profile.partnerSummary}].

3 kart (Sol, Orta, Sağ) — her birinin hakkını ver, birbirini nasıl etkilediklerini hikayeleştir.

Yanıtını yalnızca şu JSON formatında ver:
{
  "paragraph1": "Paragraf 1",
  "paragraph2": "Paragraf 2",
  "paragraph3": "Tek cümlelik tavsiye"
}`.trim();
}

/**
 * Query → Emph (Processing) → Kie.ai (Medyum) → Zod + retry
 */
export async function runTarotReadingPipeline(
  input: TarotPipelineInput & {
    userProfile: UserData;
    logContext?: PipelineLogContext;
  }
): Promise<string> {
  const parsedInput = TarotPipelineInputSchema.safeParse({
    question: input.question,
    cards: input.cards,
    profile: input.profile,
  });

  if (!parsedInput.success) {
    console.error("TAROT_PIPELINE_ERROR: Geçersiz tarot girdisi", parsedInput.error.flatten());
    return TAROT_READING_FALLBACK_MESSAGE;
  }

  try {
    const emphPackage = await processTarotThroughEmph(
      input.userProfile,
      parsedInput.data.question,
      parsedInput.data.cards
    );

    const reading = await requestMediumKieReading({
      logLabel: "KIE Tarot Medyum",
      systemPrompt: MEDIUM_TAROT_SYSTEM_PROMPT,
      userPrompt: buildMediumUserPrompt(emphPackage),
      temperature: 0.78,
      maxTokens: 850,
      maxRetries: 2,
    });

    if (!reading) {
      console.error("TAROT_PIPELINE_ERROR: Medyum yanıtı üretilemedi");
      return TAROT_READING_FALLBACK_MESSAGE;
    }

    if (input.logContext?.userId) {
      await logCosmicReadingToArchive({
        userId: input.logContext.userId,
        type: "Tarot",
        question: parsedInput.data.question,
        readingResult: reading,
        cardsJson: parsedInput.data.cards,
      });
    }

    return reading;
  } catch (error) {
    console.error("TAROT_PIPELINE_ERROR:", error);
    return TAROT_READING_FALLBACK_MESSAGE;
  }
}

export function assignSpreadPositions(
  cards: TarotReadingCard[]
): TarotReadingCard[] {
  return cards.map((card, index) => ({
    ...card,
    position: SPREAD_POSITIONS[index] ?? "Orta",
  }));
}
