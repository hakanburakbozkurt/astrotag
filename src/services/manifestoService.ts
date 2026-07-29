import "server-only";

import {
  calculateNatalChart,
  getNatalChartSummary,
} from "@/lib/astrology/planet-positions";
import type { NatalChartSummary } from "@/lib/astrology/types";
import {
  MANIFESTO_CATEGORIES,
  MANIFESTO_TECHNIQUES,
  type GenerateManifestoInput,
  type GenerateManifestoResult,
  type ManifestoCategoryId,
  type ManifestoTechniqueId,
  type UserManifestoRecord,
} from "@/lib/manifesto/types";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { UserData } from "@/types/user";

const MANIFESTOS_TABLE = "user_manifestos";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

type ManifestoRow = {
  id: string;
  profile_id: string;
  category: string;
  technique_type: string;
  intention: string;
  current_day: number;
  last_checked_date: string | null;
  last_message: string | null;
};

function getMaxDays(techniqueType: ManifestoTechniqueId): number {
  return (
    MANIFESTO_TECHNIQUES.find((item) => item.id === techniqueType)?.maxDays ?? 21
  );
}

function getCategoryLabel(category: ManifestoCategoryId): string {
  return (
    MANIFESTO_CATEGORIES.find((item) => item.id === category)?.label ?? category
  );
}

function todayDateKey(timeZone = "Europe/Istanbul"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dayBefore(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() - 1);
  return utc.toISOString().slice(0, 10);
}

function isValidCategory(value: string): value is ManifestoCategoryId {
  return MANIFESTO_CATEGORIES.some((item) => item.id === value);
}

function isValidTechnique(value: string): value is ManifestoTechniqueId {
  return MANIFESTO_TECHNIQUES.some((item) => item.id === value);
}

function toRecord(
  row: ManifestoRow,
  generatedToday: boolean
): UserManifestoRecord {
  const techniqueType = row.technique_type as ManifestoTechniqueId;
  const maxDays = getMaxDays(techniqueType);

  return {
    id: row.id,
    category: row.category as ManifestoCategoryId,
    techniqueType,
    intention: row.intention,
    currentDay: row.current_day,
    maxDays,
    lastCheckedDate: row.last_checked_date,
    lastMessage: row.last_message,
    isComplete: row.current_day >= maxDays && row.last_checked_date !== null,
    generatedToday,
  };
}

function resolveNextDay(input: {
  lastCheckedDate: string | null;
  currentDay: number;
  maxDays: number;
  today: string;
}): { nextDay: number; shouldGenerate: boolean; generatedToday: boolean } {
  const { lastCheckedDate, currentDay, maxDays, today } = input;

  if (lastCheckedDate === today) {
    return { nextDay: currentDay, shouldGenerate: false, generatedToday: true };
  }

  if (!lastCheckedDate) {
    return { nextDay: 1, shouldGenerate: true, generatedToday: false };
  }

  const yesterday = dayBefore(today);

  if (lastCheckedDate === yesterday) {
    if (currentDay >= maxDays) {
      return { nextDay: 1, shouldGenerate: true, generatedToday: false };
    }
    return {
      nextDay: currentDay + 1,
      shouldGenerate: true,
      generatedToday: false,
    };
  }

  return { nextDay: 1, shouldGenerate: true, generatedToday: false };
}

function buildNatalContext(summary: NatalChartSummary): string {
  const sun = summary.planets.find((planet) => planet.id === "sun");
  const moon = summary.planets.find((planet) => planet.id === "moon");
  const asc = summary.ascendant;

  const topAspects = summary.aspects.slice(0, 4).map(
    (aspect) =>
      `${aspect.planetA}-${aspect.planetB} ${aspect.typeLabel} (${aspect.orb}°)`
  );

  return [
    `Yükselen: ${asc.signName} ${Math.floor(asc.degreeInSign)}°`,
    sun ? `Güneş: ${sun.label}` : null,
    moon ? `Ay: ${moon.label}` : null,
    topAspects.length ? `Öne çıkan açılar: ${topAspects.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateManifestSentence(input: {
  user: UserData;
  natalSummary: NatalChartSummary;
  category: ManifestoCategoryId;
  techniqueType: ManifestoTechniqueId;
  intention: string;
  currentDay: number;
  maxDays: number;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY yapılandırılmamış.");
  }

  const techniqueLabel =
    input.techniqueType === "21_days" ? "21 Gün Kuralı" : "5×55 Tekniği";

  const systemPrompt = `Sen AstroTag Manifesto Motoru'sun.
Kullanıcının doğum haritası verilerine ve niyetine göre TEK bir günlük manifest cümlesi yaz.
Kurallar:
- Türkçe, kısa (en fazla 2 cümle), vurucu ve ezoterik
- Emir kipi veya güçlü olumlu ifade
- Korku satışı, garanti vaadi, tıbbi/finansal tavsiye yok
- Markdown yok; yalnızca düz metin cümle döndür`;

  const userPrompt = `Kullanıcı: ${input.user.name}
Kategori: ${getCategoryLabel(input.category)}
Teknik: ${techniqueLabel}
Döngü: Gün ${input.currentDay} / ${input.maxDays}
Niyet: ${input.intention.trim() || "Genel dönüşüm ve hizalanma"}

Doğum haritası özeti:
${buildNatalContext(input.natalSummary)}

Bugün için kişiselleştirilmiş manifest cümlesini yaz.`;

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.82,
      max_tokens: 120,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Manifesto üretilemedi.");
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Manifesto yanıtı boş döndü.");
  }

  return content.replace(/^["']|["']$/g, "").trim();
}

export async function loadManifestoState(
  profileId: string,
  input: Pick<GenerateManifestoInput, "category" | "techniqueType">
): Promise<UserManifestoRecord | null> {
  if (!isValidCategory(input.category) || !isValidTechnique(input.techniqueType)) {
    return null;
  }

  const admin = createServiceRoleClient();
  const today = todayDateKey();

  const { data, error } = await admin
    .from(MANIFESTOS_TABLE)
    .select("*")
    .eq("profile_id", profileId)
    .eq("category", input.category)
    .eq("technique_type", input.techniqueType)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toRecord(data as ManifestoRow, data.last_checked_date === today);
}

export async function getOrGenerateDailyManifesto(
  profileId: string,
  user: UserData,
  input: GenerateManifestoInput
): Promise<GenerateManifestoResult> {
  if (!isValidCategory(input.category)) {
    return { ok: false, error: "Geçersiz kategori." };
  }

  if (!isValidTechnique(input.techniqueType)) {
    return { ok: false, error: "Geçersiz teknik türü." };
  }

  if (!user.birthDate || !user.birthTime || !user.birthPlace) {
    return { ok: false, error: "Manifesto için doğum bilgileri gerekli." };
  }

  const admin = createServiceRoleClient();
  const today = todayDateKey();
  const maxDays = getMaxDays(input.techniqueType);
  const intention = input.intention.trim();

  const { data: existing, error: readError } = await admin
    .from(MANIFESTOS_TABLE)
    .select("*")
    .eq("profile_id", profileId)
    .eq("category", input.category)
    .eq("technique_type", input.techniqueType)
    .maybeSingle();

  if (readError) {
    console.error("[manifestoService] read failed:", readError.message);
    return { ok: false, error: "Manifesto kaydı okunamadı." };
  }

  const row = existing as ManifestoRow | null;
  const { nextDay, shouldGenerate, generatedToday } = resolveNextDay({
    lastCheckedDate: row?.last_checked_date ?? null,
    currentDay: row?.current_day ?? 1,
    maxDays,
    today,
  });

  if (!shouldGenerate && row) {
    const updatedIntention = intention || row.intention;
    if (updatedIntention !== row.intention) {
      await admin
        .from(MANIFESTOS_TABLE)
        .update({
          intention: updatedIntention,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    }

    return {
      ok: true,
      manifesto: toRecord(
        { ...row, intention: updatedIntention },
        generatedToday
      ),
    };
  }

  try {
    const chart = await calculateNatalChart({
      birthDate: user.birthDate,
      birthTime: user.birthTime,
      birthPlace: user.birthPlace,
    });
    const natalSummary = getNatalChartSummary(chart);

    const message = await generateManifestSentence({
      user,
      natalSummary,
      category: input.category,
      techniqueType: input.techniqueType,
      intention,
      currentDay: nextDay,
      maxDays,
    });

    const nowIso = new Date().toISOString();
    const payload = {
      profile_id: profileId,
      category: input.category,
      technique_type: input.techniqueType,
      intention: intention || row?.intention || "",
      current_day: nextDay,
      last_checked_date: today,
      last_message: message,
      updated_at: nowIso,
    };

    if (row) {
      const { data: updated, error: updateError } = await admin
        .from(MANIFESTOS_TABLE)
        .update(payload)
        .eq("id", row.id)
        .select("*")
        .single();

      if (updateError || !updated) {
        return { ok: false, error: "Manifesto güncellenemedi." };
      }

      return {
        ok: true,
        manifesto: toRecord(updated as ManifestoRow, true),
      };
    }

    const { data: inserted, error: insertError } = await admin
      .from(MANIFESTOS_TABLE)
      .insert(payload)
      .select("*")
      .single();

    if (insertError || !inserted) {
      return { ok: false, error: "Manifesto kaydedilemedi." };
    }

    return {
      ok: true,
      manifesto: toRecord(inserted as ManifestoRow, true),
    };
  } catch (error) {
    console.error("[manifestoService] generate failed:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Günlük manifesto oluşturulamadı.",
    };
  }
}
