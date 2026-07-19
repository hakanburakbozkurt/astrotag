import "server-only";

/**
 * AnalysisResults — çift katmanlı Tarot pipeline
 * @see src/lib/ai/oracle-presentation-prompts.ts
 */
import type { EmphEnrichedPackage } from "@/lib/astrology/emph-processing-engine";
import { processTarotThroughEmph } from "@/lib/astrology/emph-processing-engine";
import { TAROT_READING_FALLBACK_MESSAGE } from "@/lib/ai/tarot-constants";
import { ORACLE_JSON_GUARDRAIL } from "@/lib/ai/oracle-guardrails";
import {
  buildTarotDualLayerSystemPrompt,
  ORACLE_DUAL_LAYER_USER_PROMPT_SUFFIX,
} from "@/lib/ai/oracle-presentation-prompts";
import { requestMediumKiePresentation } from "@/lib/ai/request-medium-kie-presentation";
import {
  TarotPipelineInputSchema,
  type TarotPipelineInput,
  type TarotReadingCard,
} from "@/lib/ai/tarot-pipeline-schemas";
import type { OracleAnalysisPresentation } from "@/lib/analysis/types";
import { formatPresentationForArchive } from "@/lib/analysis/types";
import type { PipelineLogContext } from "@/lib/cosmic-journal/log-reading";
import { logCosmicReadingToArchive } from "@/lib/cosmic-journal/log-reading";
import { STAR_POINTS_COST_PER_ACTION } from "@/lib/constants/cosmic";
import type { UserData } from "@/types/user";

const SPREAD_POSITIONS = ["Sol", "Orta", "Sağ"] as const;

function buildTarotUserPrompt(emphPackage: EmphEnrichedPackage): string {
  return `${ORACLE_JSON_GUARDRAIL}

Aşağıdaki JSON, Emph ephemeris motorunun ürettiği GERÇEKLİK paketidir. Bunu tek kaynak kabul et; kart sembolizmi + natal harita etkisini birlikte oku.

EMPH PAKETİ (JSON):
${JSON.stringify(emphPackage, null, 2)}

Kullanıcı: [${emphPackage.profile.userSummary}].
Partner: [${emphPackage.profile.partnerSummary}].

3 kart (Sol, Orta, Sağ) — details içinde her birinin hakkını ver.
executiveSummary: tam 3 cümle; kartların ruhuna dokunan fısıltı.
Soru: "${emphPackage.question}"

${ORACLE_DUAL_LAYER_USER_PROMPT_SUFFIX}`.trim();
}

function toTarotPresentation(
  json: { executiveSummary: string; details: string }
): OracleAnalysisPresentation {
  return {
    executiveSummary: json.executiveSummary.trim(),
    details: json.details.trim(),
    isPremium: true,
    cost: STAR_POINTS_COST_PER_ACTION,
  };
}

/**
 * Query → Emph → KIE (dual-layer JSON) → OracleAnalysisPresentation
 */
export async function runTarotReadingPipeline(
  input: TarotPipelineInput & {
    userProfile: UserData;
    logContext?: PipelineLogContext;
  }
): Promise<OracleAnalysisPresentation | null> {
  const parsedInput = TarotPipelineInputSchema.safeParse({
    question: input.question,
    cards: input.cards,
    profile: input.profile,
  });

  if (!parsedInput.success) {
    console.error("TAROT_PIPELINE_ERROR: Geçersiz tarot girdisi", parsedInput.error.flatten());
    return null;
  }

  try {
    const emphPackage = await processTarotThroughEmph(
      input.userProfile,
      parsedInput.data.question,
      parsedInput.data.cards
    );

    const json = await requestMediumKiePresentation({
      logLabel: "KIE Tarot Medyum",
      systemPrompt: buildTarotDualLayerSystemPrompt(),
      userPrompt: buildTarotUserPrompt(emphPackage),
      temperature: 0.78,
      maxTokens: 950,
      maxRetries: 2,
    });

    if (!json) {
      console.error("TAROT_PIPELINE_ERROR: Medyum yanıtı üretilemedi");
      return null;
    }

    const presentation = toTarotPresentation(json);

    if (input.logContext?.userId) {
      await logCosmicReadingToArchive({
        userId: input.logContext.userId,
        type: "Tarot",
        question: parsedInput.data.question,
        readingResult: formatPresentationForArchive(presentation),
        cardsJson: parsedInput.data.cards,
      });
    }

    return presentation;
  } catch (error) {
    console.error("TAROT_PIPELINE_ERROR:", error);
    return null;
  }
}

/** @deprecated pipeline null döner; UI TAROT_READING_FALLBACK_MESSAGE kullanır */
export const TAROT_PIPELINE_LEGACY_FALLBACK = TAROT_READING_FALLBACK_MESSAGE;

export function assignSpreadPositions(
  cards: TarotReadingCard[]
): TarotReadingCard[] {
  return cards.map((card, index) => ({
    ...card,
    position: SPREAD_POSITIONS[index] ?? "Orta",
  }));
}
