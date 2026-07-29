import "server-only";

import { z } from "zod";
import { callKieChat, logKieApiKeyStatus } from "@/lib/ai/kie-client";
import {
  buildManifestoSystemPrompt,
  buildManifestoUserPromptSuffix,
} from "@/lib/ai/manifesto-presentation-prompts";
import {
  MEDIUM_RETRY_NUDGE,
  detectRoboticMediumTone,
} from "@/lib/ai/medium-persona";
import { ORACLE_JSON_GUARDRAIL } from "@/lib/ai/oracle-guardrails";
import { buildManifestoEmphPackage } from "@/lib/manifesto/manifesto-emph.server";
import {
  formatManifestoForDisplay,
  type ManifestoPresentation,
} from "@/lib/manifesto/manifesto-presentation";
import {
  MANIFESTO_CATEGORIES,
  MANIFESTO_TECHNIQUES,
  type ManifestoCategoryId,
  type ManifestoTechniqueId,
} from "@/lib/manifesto/types";
import type { UserData } from "@/types/user";

const ManifestoPresentationSchema = z.object({
  cosmicHook: z.string().min(40).max(420),
  natalMirror: z.string().min(60).max(720),
  manifestoClaim: z.string().min(24).max(320),
  ritualWhisper: z.string().min(16).max(220),
});

function getCategoryLabel(category: ManifestoCategoryId): string {
  return MANIFESTO_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

function getTechniqueLabel(techniqueType: ManifestoTechniqueId): string {
  return (
    MANIFESTO_TECHNIQUES.find((item) => item.id === techniqueType)?.label ??
    techniqueType
  );
}

function parseManifestoJson(raw: string): ManifestoPresentation | null {
  const trimmed = raw.trim();

  const tryParse = (candidate: string): ManifestoPresentation | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      const result = ManifestoPresentationSchema.safeParse(parsed);
      if (!result.success) {
        return null;
      }
      return {
        cosmicHook: result.data.cosmicHook.trim(),
        natalMirror: result.data.natalMirror.trim(),
        manifestoClaim: result.data.manifestoClaim.trim(),
        ritualWhisper: result.data.ritualWhisper.trim(),
      };
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

  return null;
}

function buildManifestoUserPrompt(
  emphPackage: Awaited<ReturnType<typeof buildManifestoEmphPackage>>
): string {
  return `${ORACLE_JSON_GUARDRAIL}

Aşağıdaki JSON, Emph ephemeris motorunun manifesto paketidir. TEK KAYNAK budur — uydurma gezegen/ev/transit ekleme.

EMPH PAKETİ (JSON):
${JSON.stringify(emphPackage, null, 2)}

${buildManifestoUserPromptSuffix()}

4 katmanlı manifestoyu JSON olarak yaz.`;
}

function isRoboticManifesto(presentation: ManifestoPresentation): boolean {
  const combined = formatManifestoForDisplay(presentation);
  return detectRoboticMediumTone(combined);
}

/** DB'ye yazılacak JSON string + parse edilmiş katmanlar */
export type ManifestoPipelineResult = {
  storageJson: string;
  presentation: ManifestoPresentation;
  displayText: string;
};

export async function runManifestoPipeline(input: {
  user: UserData;
  category: ManifestoCategoryId;
  techniqueType: ManifestoTechniqueId;
  intention: string;
  cycleDay: number;
  maxDays: number;
}): Promise<ManifestoPipelineResult | null> {
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
          { role: "system", content: buildManifestoSystemPrompt() },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.86,
          max_tokens: 1100,
        }
      );

      const presentation = parseManifestoJson(rawContent);
      if (!presentation) {
        console.error(
          `[manifesto-pipeline] JSON doğrulama başarısız (deneme ${attempt + 1})`
        );
        userPrompt = `${buildManifestoUserPrompt(emphPackage)}\n\n${MEDIUM_RETRY_NUDGE}\nYanıtı yalnızca {"cosmicHook","natalMirror","manifestoClaim","ritualWhisper"} JSON olarak ver.`;
        continue;
      }

      if (isRoboticManifesto(presentation)) {
        console.error(
          `[manifesto-pipeline] Robotik ton algılandı (deneme ${attempt + 1})`
        );
        userPrompt = `${buildManifestoUserPrompt(emphPackage)}\n\n${MEDIUM_RETRY_NUDGE}\nDaha keskin, kişiye özel metaforlar kullan; genel manifesto kalıplarından kaçın.`;
        continue;
      }

      return {
        storageJson: JSON.stringify(presentation),
        presentation,
        displayText: formatManifestoForDisplay(presentation),
      };
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
