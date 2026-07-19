import "server-only";

/**
 * AnalysisResults geçişi: buildCosmicProfileDualLayerSystemPrompt + medium-kie-presentation
 * @see src/lib/ai/oracle-presentation-prompts.ts
 */
import type { EmphEnrichedPackage } from "@/lib/astrology/emph-processing-engine";
import { processCosmicProfileThroughEmph } from "@/lib/astrology/emph-processing-engine";
import { ORACLE_JSON_GUARDRAIL } from "@/lib/ai/oracle-guardrails";
import { MEDIUM_COSMIC_PROFILE_SYSTEM_PROMPT } from "@/lib/ai/medium-persona";
import { requestMediumKieReading } from "@/lib/ai/medium-kie";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";
import type { CosmicProfileTierId } from "@/lib/cosmic-profile/types";
import type { UserData } from "@/types/user";

const TIER_KIE_CONFIG: Record<
  CosmicProfileTierId,
  { temperature: number; maxTokens: number }
> = {
  entry: { temperature: 0.72, maxTokens: 650 },
  depth: { temperature: 0.76, maxTokens: 900 },
  master: { temperature: 0.78, maxTokens: 1200 },
};

function buildCosmicProfileUserPrompt(emphPackage: EmphEnrichedPackage): string {
  return `${ORACLE_JSON_GUARDRAIL}

Aşağıdaki JSON, Emph ephemeris motorunun Kozmik Profil paketidir. complexity seviyesine sadık kal.

EMPH PAKETİ (JSON):
${JSON.stringify(emphPackage, null, 2)}

Yanıtını yalnızca şu JSON formatında ver:
{
  "paragraph1": "Paragraf 1",
  "paragraph2": "Paragraf 2",
  "paragraph3": "Tek cümlelik kozmik rehberlik"
}`.trim();
}

export async function runCosmicProfilePipeline(
  userData: UserData,
  subjectName: string,
  tier: CosmicProfileTierId
): Promise<string | null> {
  try {
    const emphPackage = await processCosmicProfileThroughEmph(
      userData,
      subjectName,
      tier
    );
    const kieConfig = TIER_KIE_CONFIG[tier];

    const reading = await requestMediumKieReading({
      logLabel: `KIE Kozmik Profil (${tier})`,
      systemPrompt: MEDIUM_COSMIC_PROFILE_SYSTEM_PROMPT,
      userPrompt: buildCosmicProfileUserPrompt(emphPackage),
      temperature: kieConfig.temperature,
      maxTokens: kieConfig.maxTokens,
      maxRetries: 2,
    });

    return reading;
  } catch (error) {
    console.error("COSMIC_PROFILE_PIPELINE_ERROR:", error);
    return null;
  }
}

export const COSMIC_PROFILE_PIPELINE_FALLBACK = ORACLE_COSMIC_DATA_ERROR;
