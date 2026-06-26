import { withOracleGuardrail } from "@/lib/ai/oracle-guardrails";
import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { SynastryCalculation } from "@/lib/synastry/synastry-calculation";
import {
  calculateSynastryScore,
  debugSynastryScore,
  type SynastryScoreAnalysis,
} from "@/lib/synastry/synastry-score-engine";
import { hasPartnerData, type UserData } from "@/types/user";

export const SYNASTRY_ERROR_MESSAGE =
  "Synastry analizi şu an tamamlanamadı. Kozmik bağlantı kısa süre sonra yeniden denenebilir.";

const KIE_MODEL = process.env.KIE_TAROT_MODEL ?? "gpt-5-2";
const KIE_CHAT_COMPLETIONS_URL = `https://api.kie.ai/${KIE_MODEL}/v1/chat/completions`;

const SCORE_NARRATION_PROMPT = withOracleGuardrail(`Sen AstroTag Oracle ilişki metin yazarısın.
GÖREV: Aşağıdaki ALGORİTMİK SYNastry SKORU ve ANALİZ JSON'unu kullanarak TEK CÜMLELİK Türkçe özet yaz.
KURALLAR:
- Skoru ASLA değiştirme veya yeniden hesaplama; score alanı kutsaldır.
- JSON facts dışında yeni aspect, ev veya gezegen uydurma.
- Teknik orb/açı detaylarını sadece verilen facts ile sınırla.
- Markdown kullanma.
- Yanıt yalnızca geçerli JSON: {"summary": "string"}`);

const ANALYZE_SYSTEM_PROMPT = withOracleGuardrail(`Sen AstroTag Oracle synastry yorumcususun.
Görevin: ALGORİTMİK SKOR PAKETİ + natal/transit ephemeris verilerini kullanarak ilişki odaklı teknik synastry analizi yazmak.
Skoru ve aspect facts listesini ASLA değiştirme; yalnızca yorumla.
Mutlaka ephemeris motorundan gelen o anki gökyüzü konumlarını (transit gezegen dereceleri ve natal açıları) hesaba kat.
Türkçe yaz, markdown kullanma, 3-4 paragraf.
Venüs, Mars, Ay, Güneş ve Satürn-Uranüs eksenlerine teknik atıflar yap — yalnızca verilen JSON içindeki facts ile.
Son paragrafta net, uygulanabilir ilişki rehberliği ver.`);

export interface SynastryScoreResponse {
  score: number;
  summary: string;
  date: string;
  analysis?: SynastryScoreAnalysis;
}

export interface SynastryAnalyzeResponse {
  analysis: string;
  cosmicContext?: CosmicAnalysisContext;
  scoreAnalysis?: SynastryScoreAnalysis;
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
      temperature: 0.45,
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

Astro-Bağ (Bond):
- İlişki durumu: ${userData.relationshipStatus?.trim() || "Belirtilmedi"}
- Tanışma tarihi: ${userData.partnerMeetingDate?.trim() || "Belirtilmedi"}

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

function buildScoreAnalysisPayload(
  userData: UserData,
  scoreAnalysis: SynastryScoreAnalysis,
  dateKey: string
): string {
  return `
Bugünün tarihi: ${dateKey}

ALGORİTMİK SYNastry SKOR PAKETİ (DEĞİŞTİRİLEMEZ):
${JSON.stringify(scoreAnalysis, null, 2)}

Çift:
- ${userData.name} × ${userData.partnerName}
`.trim();
}

function parseSummaryPayload(raw: string, fallback: string): string {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { summary?: string };
    return parsed.summary?.trim() || fallback;
  } catch {
    return fallback;
  }
}

function assertPartnerReady(userData: UserData): void {
  if (!hasPartnerData(userData)) {
    throw new SynastryReadingError(
      "Synastry analizi için partner doğum bilgileri eksik. Partner ayarlarını tamamlayın."
    );
  }
}

export async function computeAlgorithmicSynastryScore(
  userData: UserData
): Promise<SynastryScoreAnalysis> {
  assertPartnerReady(userData);

  debugSynastryScore("computeAlgorithmicSynastryScore:input", {
    userBirthDate: userData.birthDate,
    partnerBirthDate: userData.partnerBirthDate,
    partnerBirthTime: userData.partnerBirthTime,
    partnerBirthPlace: userData.partnerBirthPlace,
  });

  const calculation = await SynastryCalculation(userData);
  if (!calculation.ok) {
    throw new SynastryReadingError(calculation.message);
  }

  debugSynastryScore("computeAlgorithmicSynastryScore:calculation", {
    aspectCount: calculation.data.aspectLines.length,
    userAscendant: calculation.data.userAscendant,
    partnerAscendant: calculation.data.partnerAscendant,
  });

  return calculateSynastryScore(calculation.data);
}

async function requestSynastryScoreSummary(
  userData: UserData,
  scoreAnalysis: SynastryScoreAnalysis,
  dateKey: string
): Promise<string> {
  try {
    const content = await callKie([
      { role: "system", content: SCORE_NARRATION_PROMPT },
      {
        role: "user",
        content: `${buildScoreAnalysisPayload(userData, scoreAnalysis, dateKey)}

score=${scoreAnalysis.score} değerini koru; yalnızca summary üret.`,
      },
    ]);

    return parseSummaryPayload(content, scoreAnalysis.algorithmSummary);
  } catch (error) {
    console.error("SYNASTRY_SCORE_NARRATION_FALLBACK:", error);
    return scoreAnalysis.algorithmSummary;
  }
}

export async function requestSynastryScore(
  userData: UserData,
  dateKey: string
): Promise<SynastryScoreResponse> {
  const scoreAnalysis = await computeAlgorithmicSynastryScore(userData);
  const summary = await requestSynastryScoreSummary(userData, scoreAnalysis, dateKey);

  return {
    score: scoreAnalysis.score,
    summary,
    date: dateKey,
    analysis: scoreAnalysis,
  };
}

export async function requestSynastryAnalysis(
  question: string,
  userData: UserData,
  context: CosmicAnalysisContext,
  scoreAnalysis?: SynastryScoreAnalysis
): Promise<SynastryAnalyzeResponse> {
  assertPartnerReady(userData);

  if (!question?.trim()) {
    throw new SynastryReadingError("Lütfen bir ilişki sorusu yazın.");
  }

  const resolvedScoreAnalysis =
    scoreAnalysis ?? (await computeAlgorithmicSynastryScore(userData));

  const analysis = await callKie([
    { role: "system", content: ANALYZE_SYSTEM_PROMPT },
    {
      role: "user",
      content: `${buildContextPayload(userData, context)}

${buildScoreAnalysisPayload(userData, resolvedScoreAnalysis, context.askedAt.slice(0, 10))}

İlişki sorusu:
"${question.trim()}"

Yukarıdaki algoritmik skor paketi + natal/synastry/transit verilerini harmanlayarak teknik synastry analizi yaz.`,
    },
  ]);

  return {
    analysis,
    cosmicContext: context,
    scoreAnalysis: resolvedScoreAnalysis,
  };
}
