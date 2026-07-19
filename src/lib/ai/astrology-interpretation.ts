import type { UserData } from "@/types/user";
import type { NatalChartSummary } from "@/lib/astrology/types";
import { buildNatalInterpretationSystemPrompt } from "@/lib/ai/oracle-presentation-prompts";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";
import { TarotReadingError } from "@/lib/ai/tarot";
import { parseOracleAnalysisFromJson } from "@/lib/analysis/parse-oracle-response";
import type { OracleAnalysisPresentation } from "@/lib/analysis/types";
import { STAR_POINTS_COST_PER_ACTION } from "@/lib/constants/cosmic";

const ASTROLOGY_SYSTEM_PROMPT = buildNatalInterpretationSystemPrompt();

const KIE_TAROT_MODEL = process.env.KIE_TAROT_MODEL ?? "gpt-5-2";
const KIE_CHAT_COMPLETIONS_URL = `https://api.kie.ai/${KIE_TAROT_MODEL}/v1/chat/completions`;

export interface AstrologyInterpretationResponse {
  /** @deprecated presentation.details kullanın — AnalysisResults geçişi */
  interpretation: string;
  /** AnalysisResults — Natal modül geçişine hazır */
  presentation: OracleAnalysisPresentation;
}

type KieEnvelope = {
  code?: number;
  msg?: string;
  choices?: Array<{ message?: { content?: string } }>;
};

function buildInterpretationMessage(
  userData: UserData,
  natalChartSummary: NatalChartSummary
): string {
  return `
Kullanıcı: ${userData.name}
Doğum: ${userData.birthDate} ${userData.birthTime} — ${userData.birthPlace}

Doğum haritası teknik verileri (JSON — TEK KAYNAK):
${JSON.stringify(natalChartSummary, null, 2)}

JSON dışına çıkmadan Türkçe yorum üret. Markdown kullanma.
executiveSummary: tam 3 cümle — şefkatli, aidiyet hissi; yıldızlar seni en başından tanıyor; hayalinle harita potansiyeli arasındaki bağı kur.
details: derin teknik natal analiz (4-5 paragraf).
Yanıt yalnızca geçerli JSON: {"executiveSummary":"...","details":"..."}
`.trim();
}

function extractInterpretation(data: KieEnvelope): string | null {
  return data.choices?.[0]?.message?.content?.trim() || null;
}

export async function requestAstrologyInterpretation(
  userData: UserData,
  natalChartSummary: NatalChartSummary
): Promise<AstrologyInterpretationResponse> {
  const apiKey = process.env.KIE_API_KEY?.trim();
  if (!apiKey) {
    throw new TarotReadingError(
      "Kozmik bağlantı kurulamadı. API anahtarı henüz yapılandırılmamış."
    );
  }

  try {
    const response = await fetch(KIE_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: KIE_TAROT_MODEL,
        temperature: 0.75,
        max_tokens: 750,
        messages: [
          { role: "system", content: ASTROLOGY_SYSTEM_PROMPT },
          {
            role: "user",
            content: buildInterpretationMessage(userData, natalChartSummary),
          },
        ],
      }),
    });

    const data = (await response.json()) as KieEnvelope;

    if (!response.ok) {
      console.error("--- KIE.ai ASTROLOGY HATA ---", response.status, data);
      throw new TarotReadingError(ORACLE_COSMIC_DATA_ERROR);
    }

    if (typeof data.code === "number" && data.code !== 200) {
      throw new TarotReadingError(ORACLE_COSMIC_DATA_ERROR);
    }

    const raw = extractInterpretation(data);
    if (!raw) {
      throw new TarotReadingError(ORACLE_COSMIC_DATA_ERROR);
    }

    const presentation = parseOracleAnalysisFromJson(raw, {
      cost: STAR_POINTS_COST_PER_ACTION,
      isPremium: true,
      fallbackDetails: raw,
    });

    return {
      presentation,
      interpretation: presentation.details,
    };
  } catch (error) {
    if (error instanceof TarotReadingError) {
      throw error;
    }
    throw new TarotReadingError(ORACLE_COSMIC_DATA_ERROR);
  }
}
