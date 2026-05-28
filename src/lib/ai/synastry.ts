import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { hasPartnerData, type UserData } from "@/types/user";

export const SYNASTRY_ERROR_MESSAGE =
  "Synastry analizi şu an tamamlanamadı. Kozmik bağlantı kısa süre sonra yeniden denenebilir.";

const KIE_MODEL = process.env.KIE_TAROT_MODEL ?? "gpt-5-2";
const KIE_CHAT_COMPLETIONS_URL = `https://api.kie.ai/${KIE_MODEL}/v1/chat/completions`;

const SCORE_SYSTEM_PROMPT = `Sen teknik bir synastry astrologusun.
Kullanıcının natal haritası, partnerin natal haritası ve o anki transit ephemeris verilerini birleştirerek günlük ilişki uyum skoru üret.
Yanıtı yalnızca geçerli JSON olarak ver: {"score": number, "summary": "string"}
score 1-100 arası tam sayı olmalı.
summary tek cümle, Türkçe, ilişki odaklı olmalı.
Markdown kullanma, ek açıklama yazma.`;

const ANALYZE_SYSTEM_PROMPT = `Sen otoriter bir synastry ve ilişki astrologusun.
Görevin: Kullanıcının Natal Haritası + Partnerin Natal Haritası + o anki Transit Ephemeris verilerini birleştirerek ilişki odaklı, derinlemesine teknik bir synastry analizi yapmak.
Mutlaka ephemeris motorundan gelen o anki gökyüzü konumlarını (transit gezegen dereceleri ve natal açıları) hesaba kat.
Türkçe yaz, markdown kullanma, 3-4 paragraf.
Venüs, Mars, Ay, Güneş ve Satürn-Uranüs eksenlerine teknik atıflar yap.
Son paragrafta net, uygulanabilir ilişki rehberliği ver.`;

export interface SynastryScoreResponse {
  score: number;
  summary: string;
  date: string;
}

export interface SynastryAnalyzeResponse {
  analysis: string;
  cosmicContext?: CosmicAnalysisContext;
}

export class SynastryReadingError extends Error {
  constructor(message: string = SYNASTRY_ERROR_MESSAGE) {
    super(message);
    this.name = "SynastryReadingError";
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
    throw new SynastryReadingError(
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
      temperature: 0.58,
      max_tokens: 900,
      messages,
    }),
  });

  const data = (await response.json()) as KieEnvelope;

  if (!response.ok) {
    console.error("SYNASTRY_KIE_ERROR:", response.status, data);
    throw new SynastryReadingError(SYNASTRY_ERROR_MESSAGE);
  }

  if (typeof data.code === "number" && data.code !== 200) {
    console.error("SYNASTRY_KIE_CODE:", data.code, data.msg);
    throw new SynastryReadingError(SYNASTRY_ERROR_MESSAGE);
  }

  const content = extractContent(data);
  if (!content) {
    throw new SynastryReadingError("KIE.ai boş yanıt döndürdü.");
  }

  return content;
}

function buildContextPayload(userData: UserData, context: CosmicAnalysisContext): string {
  return `
Analiz anı (ISO): ${context.askedAt}

Kullanıcı:
- İsim: ${userData.name}
- Doğum: ${userData.birthDate} ${userData.birthTime} / ${userData.birthPlace}

Partner:
- İsim: ${context.synastry?.partnerName ?? userData.partnerName}
- Doğum: ${userData.partnerBirthDate} ${userData.partnerBirthTime} / ${userData.partnerBirthPlace}

NATAL HARİTA — KULLANICI (JSON):
${JSON.stringify(context.natal, null, 2)}

NATAL HARİTA — PARTNER (JSON):
${JSON.stringify(context.synastry?.partnerNatal ?? {}, null, 2)}

SYNastry AÇILARI (JSON):
${JSON.stringify(context.synastry?.crossAspects ?? [], null, 2)}

ANLIK TRANSİT EPHEMERIS (JSON):
${JSON.stringify(context.transits, null, 2)}

ANLIK GÖKYÜZÜ SNAPSHOT (JSON):
${JSON.stringify(context.horaryMoment, null, 2)}
`.trim();
}

function parseScorePayload(raw: string, dateKey: string): SynastryScoreResponse {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new SynastryReadingError("Uyum skoru ayrıştırılamadı.");
  }

  const parsed = JSON.parse(jsonMatch[0]) as { score?: number; summary?: string };
  const score = Math.round(Number(parsed.score));

  if (!Number.isFinite(score) || score < 1 || score > 100) {
    throw new SynastryReadingError("Geçersiz uyum skoru döndü.");
  }

  return {
    score,
    summary: parsed.summary?.trim() || "Bugün ilişki enerjisi dengeli görünüyor.",
    date: dateKey,
  };
}

function assertPartnerReady(userData: UserData): void {
  if (!hasPartnerData(userData)) {
    throw new SynastryReadingError(
      "Synastry analizi için partner doğum bilgileri eksik. Partner ayarlarını tamamlayın."
    );
  }
}

export async function requestSynastryScore(
  userData: UserData,
  context: CosmicAnalysisContext,
  dateKey: string
): Promise<SynastryScoreResponse> {
  assertPartnerReady(userData);

  const content = await callKie([
    { role: "system", content: SCORE_SYSTEM_PROMPT },
    {
      role: "user",
      content: `${buildContextPayload(userData, context)}\n\nBugünün tarihi: ${dateKey}\nGünlük uyum skoru üret.`,
    },
  ]);

  return parseScorePayload(content, dateKey);
}

export async function requestSynastryAnalysis(
  question: string,
  userData: UserData,
  context: CosmicAnalysisContext
): Promise<SynastryAnalyzeResponse> {
  assertPartnerReady(userData);

  if (!question?.trim()) {
    throw new SynastryReadingError("Lütfen bir ilişki sorusu yazın.");
  }

  const analysis = await callKie([
    { role: "system", content: ANALYZE_SYSTEM_PROMPT },
    {
      role: "user",
      content: `${buildContextPayload(userData, context)}

İlişki sorusu:
"${question.trim()}"

Yukarıdaki natal, synastry ve transit ephemeris verilerini harmanlayarak teknik synastry analizi yaz.`,
    },
  ]);

  return { analysis, cosmicContext: context };
}
