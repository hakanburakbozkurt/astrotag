export type KieChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type KieChatOptions = {
  temperature?: number;
  max_tokens?: number;
};

type KieEnvelope = {
  code?: number;
  msg?: string;
  choices?: Array<{ message?: { content?: string } }>;
};

const KIE_MODEL = process.env.KIE_TAROT_MODEL ?? "gpt-5-2";
const KIE_CHAT_COMPLETIONS_URL = `https://api.kie.ai/${KIE_MODEL}/v1/chat/completions`;

export function getKieModel(): string {
  return KIE_MODEL;
}

export function logKieApiKeyStatus(logLabel = "KIE"): void {
  const apiKey = process.env.KIE_API_KEY?.trim();
  console.log(`DEBUG: ${logLabel} API Key durumu:`, apiKey ? "Mevcut" : "EKSİK");

  if (apiKey) {
    const preview =
      apiKey.length <= 3
        ? "***"
        : `${apiKey.slice(0, 3)}${"*".repeat(Math.min(apiKey.length - 3, 12))}`;
    console.log(`DEBUG: ${logLabel} API Key önizleme:`, preview);
  }
}

/**
 * Kie.ai chat completions — projedeki diğer AI modülleriyle aynı endpoint.
 */
export async function callKieChat(
  messages: KieChatMessage[],
  options?: KieChatOptions
): Promise<string> {
  const apiKey = process.env.KIE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("KIE_API_KEY eksik veya boş");
  }

  const response = await fetch(KIE_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: KIE_MODEL,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 700,
      messages,
    }),
  });

  const data = (await response.json()) as KieEnvelope;

  if (!response.ok) {
    throw new Error(
      `Kie HTTP ${response.status}: ${data.msg ?? "istek başarısız"}`
    );
  }

  if (typeof data.code === "number" && data.code !== 200) {
    throw new Error(`Kie yanıt kodu ${data.code}: ${data.msg ?? "bilinmeyen hata"}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Kie boş yanıt döndürdü");
  }

  return content;
}
