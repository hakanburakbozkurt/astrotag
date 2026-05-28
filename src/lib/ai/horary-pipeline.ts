import "server-only";

import type { EmphEnrichedPackage } from "@/lib/astrology/emph-processing-engine";
import { processHoraryThroughEmph } from "@/lib/astrology/emph-processing-engine";
import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import {
  MEDIUM_HORARY_SYSTEM_PROMPT,
} from "@/lib/ai/medium-persona";
import { requestMediumKieReading } from "@/lib/ai/medium-kie";
import type { PipelineLogContext } from "@/lib/cosmic-journal/log-reading";
import { logCosmicReadingToArchive } from "@/lib/cosmic-journal/log-reading";
import { hasPartnerData, type UserData } from "@/types/user";

export const HORARY_PIPELINE_FALLBACK =
  "Kozmik enerjiler şu an karışık görünüyor. Yıldızlar biraz dinlenmek istiyor — lütfen kısa bir süre sonra tekrar deneyin.";

function buildHoraryMediumUserPrompt(
  emphPackage: EmphEnrichedPackage,
  userData: UserData
): string {
  const partnerBlock = hasPartnerData(userData)
    ? "Partner verisi mevcut — ilişki dinamiklerine de dokun."
    : "Partner verisi yok.";

  return `Aşağıdaki JSON, Emph ephemeris motorunun horary + natal kıyaslamasıdır. Tek kaynak budur.

EMPH PAKETİ (JSON):
${JSON.stringify(emphPackage, null, 2)}

Soru: "${emphPackage.question}"
${partnerBlock}

Yanıtını yalnızca şu JSON formatında ver:
{
  "paragraph1": "Paragraf 1 — horary anı + natal evler",
  "paragraph2": "Paragraf 2 — rehberlik/uyarı, gerilim varsa sezgisel vurgu",
  "paragraph3": "Net tek cümlelik tavsiye"
}`.trim();
}

export interface HoraryPipelineResult {
  answer: string;
  cosmicContext: CosmicAnalysisContext;
  emphPackage: EmphEnrichedPackage;
}

/**
 * Query → Emph (Processing) → Kie.ai (Medyum) → Zod + retry
 */
export async function runHoraryReadingPipeline(
  question: string,
  userData: UserData,
  logContext?: PipelineLogContext
): Promise<HoraryPipelineResult | null> {
  if (!question?.trim() || !userData?.name || !userData?.birthDate) {
    console.error("TAROT_PIPELINE_ERROR: Horary girdisi eksik");
    return null;
  }

  try {
    const emphPackage = await processHoraryThroughEmph(userData, question);

    const answer = await requestMediumKieReading({
      logLabel: "KIE Horary Medyum",
      systemPrompt: MEDIUM_HORARY_SYSTEM_PROMPT,
      userPrompt: buildHoraryMediumUserPrompt(emphPackage, userData),
      temperature: 0.72,
      maxTokens: 950,
      maxRetries: 2,
    });

    if (!answer) {
      console.error("TAROT_PIPELINE_ERROR: Horary medyum yanıtı üretilemedi");
      return null;
    }

    const cosmicContext: CosmicAnalysisContext = {
      askedAt: emphPackage.askedAt,
      natal: emphPackage.natalChart,
      horaryMoment: emphPackage.skyMoment,
      transits: {
        at: emphPackage.askedAt,
        planets: emphPackage.skyMoment.planets,
        aspectsToNatal: emphPackage.transitsToNatal,
      },
      synastry: emphPackage.synastry,
    };

    if (logContext?.userId) {
      await logCosmicReadingToArchive({
        userId: logContext.userId,
        type: "Horary",
        question: question.trim(),
        readingResult: answer,
        cardsJson: null,
      });
    }

    return { answer, cosmicContext, emphPackage };
  } catch (error) {
    console.error("TAROT_PIPELINE_ERROR: Horary pipeline hatası", error);
    return null;
  }
}
