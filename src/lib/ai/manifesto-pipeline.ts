import "server-only";

import { z } from "zod";
import { callKieChat, logKieApiKeyStatus } from "@/lib/ai/kie-client";
import {
  buildOracleSystemPrompt,
  MEDIUM_RETRY_NUDGE,
  detectRoboticMediumTone,
} from "@/lib/ai/medium-persona";
import { ORACLE_JSON_GUARDRAIL } from "@/lib/ai/oracle-guardrails";
import { buildManifestoEmphPackage } from "@/lib/manifesto/manifesto-emph.server";
import {
  MANIFESTO_CATEGORIES,
  MANIFESTO_TECHNIQUES,
  type ManifestoCategoryId,
  type ManifestoTechniqueId,
} from "@/lib/manifesto/types";
import type { UserData } from "@/types/user";

const ManifestoJsonSchema = z.object({
  manifest: z.string().min(20).max(280),
});

const MANIFESTO_SYSTEM_PROMPT = buildOracleSystemPrompt(`Sen AstroTag Manifesto Motoru'sun.
Emph ephemeris paketindeki natal harita ve bugünkü transit verilerini kullanarak TEK bir günlük manifest cümlesi yaz.
Kurallar:
- Türkçe, kısa (en fazla 2 cümle), vurucu ve ezoterik
- Emir kipi veya güçlü olumlu ifade; niyet ve kategori ile hizalı
- Korku satışı, garanti vaadi, tıbbi/finansal tavsiye yok
- Markdown yok
Yanıt YALNIZCA geçerli JSON: {"manifest":"..."}`);

function getCategoryLabel(category: ManifestoCategoryId): string {
  return MANIFESTO_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

function getTechniqueLabel(techniqueType: ManifestoTechniqueId): string {
  return (
    MANIFESTO_TECHNIQUES.find((item) => item.id === techniqueType)?.label ??
    techniqueType
  );
}

function parseManifestJson(raw: string): string | null {
  const trimmed = raw.trim();

  const tryParse = (candidate: string): string | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      const result = ManifestoJsonSchema.safeParse(parsed);
      return result.success ? result.data.manifest.trim() : null;
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

  if (trimmed.length >= 20 && trimmed.length <= 280 && !trimmed.startsWith("{")) {
    return trimmed.replace(/^["']|["']$/g, "");
  }

  return null;
}

function buildManifestoUserPrompt(
  emphPackage: Awaited<ReturnType<typeof buildManifestoEmphPackage>>
): string {
  return `${ORACLE_JSON_GUARDRAIL}

Aşağıdaki JSON, Emph ephemeris motorunun manifesto paketidir. Tek kaynak budur.

EMPH PAKETİ (JSON):
${JSON.stringify(emphPackage, null, 2)}

Bugün için kişiselleştirilmiş manifest cümlesini {"manifest":"..."} JSON formatında yaz.`;
}

export async function runManifestoPipeline(input: {
  user: UserData;
  category: ManifestoCategoryId;
  techniqueType: ManifestoTechniqueId;
  intention: string;
  cycleDay: number;
  maxDays: number;
}): Promise<string | null> {
  logKieApiKeyStatus("KIE Manifesto");

  const apiKey = process.env.KIE_API_KEY?.trim();
  if (!apiKey) {
    console.error("[manifesto-pipeline] KIE_API_KEY eksik");
    return null;
  }

  const emphPackage = await buildManifestoEmphPackage({
    userData: input.user,
    category: input.category,
    categoryLabel: getCategoryLabel(input.category),
    techniqueType: input.techniqueType,
    techniqueLabel: getTechniqueLabel(input.techniqueType),
    intention: input.intention,
    cycleDay: input.cycleDay,
    maxDays: input.maxDays,
  });

  let userPrompt = buildManifestoUserPrompt(emphPackage);
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const rawContent = await callKieChat(
        [
          { role: "system", content: MANIFESTO_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.82,
          max_tokens: 160,
        }
      );

      const manifest = parseManifestJson(rawContent);
      if (!manifest) {
        console.error(
          `[manifesto-pipeline] JSON doğrulama başarısız (deneme ${attempt + 1})`
        );
        userPrompt = `${buildManifestoUserPrompt(emphPackage)}\n\n${MEDIUM_RETRY_NUDGE}\nYanıtı yalnızca {"manifest":"..."} JSON olarak ver.`;
        continue;
      }

      if (detectRoboticMediumTone(manifest)) {
        console.error(
          `[manifesto-pipeline] Robotik ton algılandı (deneme ${attempt + 1})`
        );
        userPrompt = `${buildManifestoUserPrompt(emphPackage)}\n\n${MEDIUM_RETRY_NUDGE}`;
        continue;
      }

      return manifest;
    } catch (error) {
      console.error(
        `[manifesto-pipeline] Kie erişim hatası (deneme ${attempt + 1}):`,
        error
      );
      userPrompt = `${buildManifestoUserPrompt(emphPackage)}\n\n${MEDIUM_RETRY_NUDGE}`;
    }
  }

  return null;
}
