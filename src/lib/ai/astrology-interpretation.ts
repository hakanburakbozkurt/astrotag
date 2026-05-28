import type { UserData } from "@/types/user";
import type { NatalChartSummary } from "@/lib/astrology/types";
import { COSMIC_ERROR_MESSAGE, TarotReadingError } from "@/lib/ai/tarot";

const ASTROLOGY_SYSTEM_PROMPT =
  "Sen derinlikli bir astrologsun. Kullanıcının doğum haritasındaki gezegen yerleşimlerini, evleri ve özellikle Merkür-Venüs Kavuşumu (Zihinsel zarafet), Güneş-Mars Karesi (Eylemde çatışma), Güneş-Ay Karşıtlığı (İçsel denge arayışı) gibi kritik açılarını analiz ederek, mistik, rehberlik edici ama kısa (maksimum 4-5 kısa paragraf) Türkçe bir yorum yaz.";

const KIE_TAROT_MODEL = process.env.KIE_TAROT_MODEL ?? "gpt-5-2";
const KIE_CHAT_COMPLETIONS_URL = `https://api.kie.ai/${KIE_TAROT_MODEL}/v1/chat/completions`;

export interface AstrologyInterpretationResponse {
  interpretation: string;
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

Doğum haritası teknik verileri (JSON):
${JSON.stringify(natalChartSummary, null, 2)}

Gezegenlerin açılarını ve ev yerleşimlerini analiz ederek, teknik bir astroloji yorumu üret.
Türkçe yanıt ver. Markdown kullanma. Maksimum 4-5 kısa paragraf yaz.
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
        max_tokens: 550,
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
      throw new TarotReadingError(COSMIC_ERROR_MESSAGE);
    }

    if (typeof data.code === "number" && data.code !== 200) {
      console.error("--- KIE.ai ASTROLOGY HATA ---", data.code, data.msg);
      throw new TarotReadingError(COSMIC_ERROR_MESSAGE);
    }

    const interpretation = extractInterpretation(data);
    if (!interpretation) {
      throw new TarotReadingError("KIE.ai boş yanıt döndürdü.");
    }

    return { interpretation };
  } catch (error) {
    console.error("!!! ASTROLOGY INTERPRETATION HATA !!!", error);
    if (error instanceof TarotReadingError) throw error;
    throw new TarotReadingError(COSMIC_ERROR_MESSAGE);
  }
}
