import type { UserData } from "@/types/user";
import type { TarotCardDefinition } from "@/lib/tarot/deck";
import type { NatalChartSummary } from "@/lib/astrology/types";

export const COSMIC_ERROR_MESSAGE =
  "Kozmik enerjiler şu an karışık görünüyor. Yıldızlar biraz dinlenmek istiyor — lütfen kısa bir süre sonra tekrar deneyin.";

const SYSTEM_PROMPT = `Sen derinlikli bir tarot ve astroloji yorumcusun.
Sana verilen 3 tarot kartının metin anlamlarını birleştirerek soruya kişiselleştirilmiş, mistik ama net bir yorum yaz.
Görsel üretme; yalnızca metin yorumu ver.
Türkçe yaz, markdown kullanma, 3-4 paragraf.`;

const KIE_TAROT_MODEL = process.env.KIE_TAROT_MODEL ?? "gpt-5-2";
const KIE_CHAT_COMPLETIONS_URL = `https://api.kie.ai/${KIE_TAROT_MODEL}/v1/chat/completions`;

export interface AITarotResponse {
  reading: string;
  cached?: boolean;
}

export class TarotReadingError extends Error {
  constructor(message: string = COSMIC_ERROR_MESSAGE) {
    super(message);
    this.name = "TarotReadingError";
  }
}

function buildUserMessage(
  question: string,
  userData: UserData,
  cards: TarotCardDefinition[],
  natalChartSummary?: NatalChartSummary | null
): string {
  const cardSection = cards
    .map(
      (card, index) =>
        `${index + 1}. ${card.name} (${card.id}): ${card.meaning}`
    )
    .join("\n");

  const natalSection = natalChartSummary
    ? `\nNatal özet (JSON):\n${JSON.stringify(natalChartSummary, null, 2)}\n`
    : "";

  return `
Kullanıcı: ${userData.name}
Doğum: ${userData.birthDate} ${userData.birthTime} / ${userData.birthPlace}
${natalSection}
Seçilen 3 kart:
${cardSection}

Soru:
"${question.trim()}"

Kart anlamlarını birleştirerek teknik ama anlaşılır bir tarot yorumu yaz.
`.trim();
}

type KieEnvelope = {
  code?: number;
  msg?: string;
  choices?: Array<{ message?: { content?: string } }>;
};

function extractReading(data: KieEnvelope): string | null {
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

export async function requestTarotReading(
  question: string,
  userData: UserData,
  cards: TarotCardDefinition[],
  natalChartSummary?: NatalChartSummary | null
): Promise<AITarotResponse> {
  if (!question?.trim()) {
    throw new TarotReadingError("Lütfen yıldızlara bir soru yöneltin.");
  }

  if (cards.length !== 3) {
    throw new TarotReadingError("Tarot açılımı için 3 kart seçilmelidir.");
  }

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
        temperature: 0.68,
        max_tokens: 700,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: buildUserMessage(
              question,
              userData,
              cards,
              natalChartSummary
            ),
          },
        ],
      }),
    });

    const data = (await response.json()) as KieEnvelope;

    if (!response.ok) {
      console.error("TAROT_KIE_ERROR:", response.status, data);
      throw new TarotReadingError(COSMIC_ERROR_MESSAGE);
    }

    if (typeof data.code === "number" && data.code !== 200) {
      throw new TarotReadingError(COSMIC_ERROR_MESSAGE);
    }

    const reading = extractReading(data);
    if (!reading) {
      throw new TarotReadingError("KIE.ai boş yanıt döndürdü.");
    }

    return { reading };
  } catch (error) {
    if (error instanceof TarotReadingError) throw error;
    throw new TarotReadingError(COSMIC_ERROR_MESSAGE);
  }
}
