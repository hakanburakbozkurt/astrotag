import { getDailyCompatibilityDateKey } from "@/lib/compatibility/daily-questions";
import { withOracleGuardrail } from "@/lib/ai/oracle-guardrails";
import { buildNexusEmphPackage } from "@/lib/nexus/nexus-emph.server";
import { logOracleModuleError } from "@/lib/oracle/oracle-errors";
import { resolveProfileSunSigns } from "@/lib/astrology/sun-sign";
import type { UserData } from "@/types/user";

export const NEXUS_ERROR_MESSAGE =
  "Kozmik veri akışı şu an doğrulanamıyor. Lütfen kısa süre sonra tekrar deneyin.";

const KIE_MODEL = process.env.KIE_TAROT_MODEL ?? "gpt-5-2";
const KIE_CHAT_COMPLETIONS_URL = `https://api.kie.ai/${KIE_MODEL}/v1/chat/completions`;

const NEXUS_SYSTEM_PROMPT = withOracleGuardrail(`Sen AstroTag Oracle Nexus yorumcususun.
Emph motorundan gelen transit facts + natal JSON paketini hikayeleştir.
Güneş burcu yalnızca profil bağlamıdır; asıl odağın transitStress, transitsToNatal ve cosmicTensions alanlarıdır.
Türkçe yaz, markdown kullanma.
Her yorum 2-3 cümle; abartılı ama JSON ile uyumlu olsun.
Yanıtı yalnızca geçerli JSON olarak ver:
{"userDay":"string","partnerDay":"string|null"}
partnerDay yalnızca partner burcu verilmişse dolu olmalı; yoksa null.`);

export interface NexusDailyResponse {
  userSign: string;
  partnerSign: string | null;
  userDay: string;
  partnerDay: string | null;
  date: string;
}

export class NexusReadingError extends Error {
  constructor(message: string = NEXUS_ERROR_MESSAGE) {
    super(message);
    this.name = "NexusReadingError";
  }
}

type KieEnvelope = {
  code?: number;
  msg?: string;
  choices?: Array<{ message?: { content?: string } }>;
};

function extractContent(data: KieEnvelope): string | null {
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

async function callKie(messages: Array<{ role: string; content: string }>): Promise<string> {
  const apiKey = process.env.KIE_API_KEY?.trim();
  if (!apiKey) {
    throw new NexusReadingError(
      "Kozmik bağlantı kurulamadı. API anahtarı henüz yapılandırılmamış."
    );
  }

  const response = await fetch(KIE_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: KIE_MODEL,
      temperature: 0.72,
      max_tokens: 700,
      messages,
    }),
  });

  const data = (await response.json()) as KieEnvelope;

  if (!response.ok) {
    console.error("NEXUS_KIE_ERROR:", response.status, data);
    throw new NexusReadingError(NEXUS_ERROR_MESSAGE);
  }

  if (typeof data.code === "number" && data.code !== 200) {
    console.error("NEXUS_KIE_CODE:", data.code, data.msg);
    throw new NexusReadingError(NEXUS_ERROR_MESSAGE);
  }

  const content = extractContent(data);
  if (!content) {
    throw new NexusReadingError("KIE.ai boş yanıt döndürdü.");
  }

  return content;
}

function buildNexusPrompt(emphPackage: Awaited<ReturnType<typeof buildNexusEmphPackage>>): string {
  return `
NEXUS EMPH PAKETİ (DEĞİŞTİRİLEMEZ — TEK GERÇEKLİK KAYNAĞI):
${JSON.stringify(emphPackage, null, 2)}

userDay: Kullanıcının bugünkü akışı — transitStress + transitsToNatal + natalChart verisine sadık kal.
partnerDay: Partner varsa aynı transit paketini partner perspektifinden hikayeleştir; yoksa null.
`.trim();
}

function parseNexusPayload(
  raw: string,
  signs: { userSign: string; partnerSign: string | null },
  dateKey: string
): NexusDailyResponse {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new NexusReadingError("Nexus yanıtı ayrıştırılamadı.");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    userDay?: string;
    partnerDay?: string | null;
  };

  const userDay = parsed.userDay?.trim();
  if (!userDay) {
    throw new NexusReadingError("Geçersiz Nexus yanıtı döndü.");
  }

  const partnerDay =
    signs.partnerSign && parsed.partnerDay?.trim() ? parsed.partnerDay.trim() : null;

  return {
    userSign: signs.userSign,
    partnerSign: signs.partnerSign,
    userDay,
    partnerDay,
    date: dateKey,
  };
}

export async function requestNexusDaily(
  userData: UserData,
  dateKey: string = getDailyCompatibilityDateKey()
): Promise<NexusDailyResponse> {
  const { userSign, partnerSign } = resolveProfileSunSigns(userData);

  if (!userSign) {
    throw new NexusReadingError("Güneş burcu hesaplanamadı. Doğum tarihinizi kontrol edin.");
  }

  try {
    const emphPackage = await buildNexusEmphPackage(userData, dateKey);

    const content = await callKie([
      { role: "system", content: NEXUS_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildNexusPrompt(emphPackage),
      },
    ]);

    return parseNexusPayload(content, { userSign, partnerSign }, dateKey);
  } catch (error) {
    logOracleModuleError("nexus", error, { dateKey, userId: userData.name });
    if (error instanceof NexusReadingError) {
      throw error;
    }
    throw new NexusReadingError(NEXUS_ERROR_MESSAGE);
  }
}
