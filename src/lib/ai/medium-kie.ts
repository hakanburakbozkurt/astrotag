import "server-only";

import { z } from "zod";
import { callKieChat, logKieApiKeyStatus } from "@/lib/ai/kie-client";
import {
  MEDIUM_RETRY_NUDGE,
  detectRoboticMediumTone,
} from "@/lib/ai/medium-persona";

export const MediumParagraphSchema = z.object({
  paragraph1: z.string().min(40).max(900),
  paragraph2: z.string().min(40).max(900),
  paragraph3: z.string().min(12).max(320),
});

export type MediumParagraphResponse = z.infer<typeof MediumParagraphSchema>;

function parseMediumJson(raw: string): MediumParagraphResponse | null {
  const trimmed = raw.trim();

  try {
    const direct = JSON.parse(trimmed) as unknown;
    const result = MediumParagraphSchema.safeParse(direct);
    if (result.success) {
      return result.data;
    }
  } catch {
    // devam
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      const parsed = JSON.parse(fenced[1]) as unknown;
      const result = MediumParagraphSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
    } catch {
      return null;
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
      const result = MediumParagraphSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function formatMediumParagraphs(
  validated: MediumParagraphResponse
): string {
  return [
    validated.paragraph1.trim(),
    validated.paragraph2.trim(),
    validated.paragraph3.trim(),
  ].join("\n\n");
}

export interface MediumKieRequest {
  logLabel: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

export async function requestMediumKieReading(
  request: MediumKieRequest
): Promise<string | null> {
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
          max_tokens: request.maxTokens ?? 900,
        }
      );

      const validated = parseMediumJson(rawContent);
      if (!validated) {
        console.error(
          `TAROT_PIPELINE_ERROR: Zod doğrulama başarısız (${request.logLabel}, deneme ${attempt + 1})`
        );
        userPrompt = `${request.userPrompt}\n\n${MEDIUM_RETRY_NUDGE}\nYanıtı yalnızca geçerli JSON olarak ver.`;
        continue;
      }

      const formatted = formatMediumParagraphs(validated);

      if (detectRoboticMediumTone(formatted)) {
        console.error(
          `TAROT_PIPELINE_ERROR: Robotik ton algılandı (${request.logLabel}, deneme ${attempt + 1})`
        );
        userPrompt = `${request.userPrompt}\n\n${MEDIUM_RETRY_NUDGE}`;
        continue;
      }

      return formatted;
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
