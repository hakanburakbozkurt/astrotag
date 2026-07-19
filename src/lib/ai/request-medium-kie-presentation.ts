import "server-only";

import { callKieChat, logKieApiKeyStatus } from "@/lib/ai/kie-client";
import {
  MEDIUM_RETRY_NUDGE,
  detectRoboticMediumTone,
} from "@/lib/ai/medium-persona";
import {
  OraclePresentationJsonSchema,
  type OraclePresentationJson,
  parseOraclePresentationJson,
} from "@/lib/ai/medium-kie-presentation";

export interface MediumKiePresentationRequest {
  logLabel: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

export async function requestMediumKiePresentation(
  request: MediumKiePresentationRequest
): Promise<OraclePresentationJson | null> {
  logKieApiKeyStatus(request.logLabel);

  const apiKey = process.env.KIE_API_KEY?.trim();
  if (!apiKey) {
    console.error(`TAROT_PIPELINE_ERROR: KIE_API_KEY eksik (${request.logLabel})`);
    return null;
  }

  const maxRetries = request.maxRetries ?? 2;
  let userPrompt = request.userPrompt;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const rawContent = await callKieChat(
        [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: request.temperature ?? 0.78,
          max_tokens: request.maxTokens ?? 950,
        }
      );

      const parsed = parseOraclePresentationJson(rawContent);
      if (!parsed) {
        console.error(
          `TAROT_PIPELINE_ERROR: Presentation JSON doğrulama başarısız (${request.logLabel}, deneme ${attempt + 1})`
        );
        userPrompt = `${request.userPrompt}\n\n${MEDIUM_RETRY_NUDGE}\nYanıtı yalnızca {"executiveSummary","details"} JSON olarak ver. executiveSummary tam 3 cümle olsun.`;
        continue;
      }

      const validated = OraclePresentationJsonSchema.safeParse(parsed);
      if (!validated.success) {
        console.error(
          `TAROT_PIPELINE_ERROR: Zod doğrulama başarısız (${request.logLabel}, deneme ${attempt + 1})`
        );
        userPrompt = `${request.userPrompt}\n\n${MEDIUM_RETRY_NUDGE}`;
        continue;
      }

      const combined = `${validated.data.executiveSummary}\n\n${validated.data.details}`;
      if (detectRoboticMediumTone(combined)) {
        console.error(
          `TAROT_PIPELINE_ERROR: Robotik ton algılandı (${request.logLabel}, deneme ${attempt + 1})`
        );
        userPrompt = `${request.userPrompt}\n\n${MEDIUM_RETRY_NUDGE}`;
        continue;
      }

      return validated.data;
    } catch (error) {
      console.error(
        `TAROT_PIPELINE_ERROR: Kie erişim hatası (${request.logLabel}, deneme ${attempt + 1}):`,
        error
      );
      userPrompt = `${request.userPrompt}\n\n${MEDIUM_RETRY_NUDGE}`;
    }
  }

  return null;
}
