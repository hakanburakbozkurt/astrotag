import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { runManifestoPipeline } from "@/lib/ai/manifesto-pipeline";
import {
  MANIFESTO_CATEGORIES,
  MANIFESTO_DB_COLUMNS,
  MANIFESTO_TECHNIQUES,
  MANIFESTO_UPSERT_CONFLICT_KEY,
  type GenerateManifestoInput,
  type GenerateManifestoResult,
  type ManifestoCategoryId,
  type ManifestoDbRow,
  type ManifestoTechniqueId,
  type UserManifestoRecord,
} from "@/lib/manifesto/types";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { UserData } from "@/types/user";

const MANIFESTOS_TABLE = "user_manifestos";

function getMaxDays(techniqueType: ManifestoTechniqueId): number {
  return (
    MANIFESTO_TECHNIQUES.find((item) => item.id === techniqueType)?.maxDays ?? 21
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

function logManifestoDbError(
  operation: string,
  profileId: string,
  error: PostgrestError | null,
  extra?: Record<string, unknown>
): void {
  console.error(`[manifestoService] ${operation} FAILED`, {
    table: MANIFESTOS_TABLE,
    profileId,
    code: error?.code ?? null,
    message: error?.message ?? "unknown",
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    ...extra,
  });
}

function toRecord(
  row: ManifestoDbRow,
  generatedToday: boolean
): UserManifestoRecord {
  const techniqueType = row.technique_type as ManifestoTechniqueId;
  const maxDays = getMaxDays(techniqueType);

  return {
    id: row.id,
    category: row.category as ManifestoCategoryId,
    techniqueType,
    intention: row.intention_text,
    currentDay: row.current_day,
    maxDays,
    lastCheckedDate: row.last_checked_date,
    lastMessage: row.daily_ai_message,
    isComplete: row.is_completed,
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

function buildDbPayload(input: {
  profileId: string;
  category: ManifestoCategoryId;
  techniqueType: ManifestoTechniqueId;
  intentionText: string;
  currentDay: number;
  maxDays: number;
  lastCheckedDate: string;
  dailyAiMessage: string;
}): Omit<
  ManifestoDbRow,
  "id" | "created_at" | "updated_at"
> {
  return {
    profile_id: input.profileId,
    category: input.category,
    technique_type: input.techniqueType,
    intention_text: input.intentionText,
    current_day: input.currentDay,
    last_checked_date: input.lastCheckedDate,
    daily_ai_message: input.dailyAiMessage,
    is_completed: input.currentDay >= input.maxDays,
  };
}

async function generateManifestSentence(input: {
  user: UserData;
  category: ManifestoCategoryId;
  techniqueType: ManifestoTechniqueId;
  intention: string;
  currentDay: number;
  maxDays: number;
}): Promise<string> {
  const message = await runManifestoPipeline({
    user: input.user,
    category: input.category,
    techniqueType: input.techniqueType,
    intention: input.intention,
    cycleDay: input.currentDay,
    maxDays: input.maxDays,
  });

  if (!message) {
    throw new Error("Kozmik manifesto üretilemedi. KIE bağlantısını kontrol edin.");
  }

  return message;
}

async function fetchManifestoRow(
  profileId: string,
  category: ManifestoCategoryId,
  techniqueType: ManifestoTechniqueId
): Promise<{ row: ManifestoDbRow | null; error: PostgrestError | null }> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from(MANIFESTOS_TABLE)
    .select(MANIFESTO_DB_COLUMNS)
    .eq("profile_id", profileId)
    .eq("category", category)
    .eq("technique_type", techniqueType)
    .maybeSingle();

  return {
    row: (data as ManifestoDbRow | null) ?? null,
    error,
  };
}

async function upsertManifestoRow(
  profileId: string,
  payload: ReturnType<typeof buildDbPayload>
): Promise<{ row: ManifestoDbRow | null; error: PostgrestError | null }> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from(MANIFESTOS_TABLE)
    .upsert(payload, { onConflict: MANIFESTO_UPSERT_CONFLICT_KEY })
    .select(MANIFESTO_DB_COLUMNS)
    .single();

  if (error) {
    logManifestoDbError("upsert", profileId, error, { payload });
    return { row: null, error };
  }

  console.info("[manifestoService] upsert OK", {
    profileId,
    category: payload.category,
    techniqueType: payload.technique_type,
    currentDay: payload.current_day,
    isCompleted: payload.is_completed,
  });

  return { row: data as ManifestoDbRow, error: null };
}

async function patchIntentionText(
  profileId: string,
  rowId: string,
  intentionText: string
): Promise<PostgrestError | null> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from(MANIFESTOS_TABLE)
    .update({
      intention_text: intentionText,
    })
    .eq("id", rowId)
    .eq("profile_id", profileId);

  if (error) {
    logManifestoDbError("patchIntentionText", profileId, error, {
      rowId,
      intentionText,
    });
  }

  return error;
}

export async function loadManifestoState(
  profileId: string,
  input: Pick<GenerateManifestoInput, "category" | "techniqueType">
): Promise<UserManifestoRecord | null> {
  if (!isValidCategory(input.category) || !isValidTechnique(input.techniqueType)) {
    return null;
  }

  const today = todayDateKey();
  const { row, error } = await fetchManifestoRow(
    profileId,
    input.category,
    input.techniqueType
  );

  if (error) {
    logManifestoDbError("loadManifestoState/read", profileId, error, {
      category: input.category,
      techniqueType: input.techniqueType,
    });
    return null;
  }

  if (!row) {
    return null;
  }

  return toRecord(row, row.last_checked_date === today);
}

export async function getOrGenerateDailyManifesto(
  profileId: string,
  user: UserData,
  input: GenerateManifestoInput
): Promise<GenerateManifestoResult> {
  if (!profileId?.trim()) {
    console.error("[manifestoService] getOrGenerateDailyManifesto: profileId boş");
    return { ok: false, error: "Profil kimliği bulunamadı.", debugCode: "NO_PROFILE_ID" };
  }

  if (!isValidCategory(input.category)) {
    return { ok: false, error: "Geçersiz kategori.", debugCode: "INVALID_CATEGORY" };
  }

  if (!isValidTechnique(input.techniqueType)) {
    return { ok: false, error: "Geçersiz teknik türü.", debugCode: "INVALID_TECHNIQUE" };
  }

  if (!user.birthDate || !user.birthTime || !user.birthPlace) {
    return {
      ok: false,
      error: "Manifesto için doğum bilgileri gerekli.",
      debugCode: "MISSING_BIRTH_DATA",
    };
  }

  const today = todayDateKey();
  const maxDays = getMaxDays(input.techniqueType);
  const intention = input.intention.trim();

  const { row, error: readError } = await fetchManifestoRow(
    profileId,
    input.category,
    input.techniqueType
  );

  if (readError) {
    return {
      ok: false,
      error: "Manifesto kaydı okunamadı.",
      debugCode: readError.code ?? "READ_FAILED",
    };
  }

  const { nextDay, shouldGenerate, generatedToday } = resolveNextDay({
    lastCheckedDate: row?.last_checked_date ?? null,
    currentDay: row?.current_day ?? 1,
    maxDays,
    today,
  });

  if (!shouldGenerate && row) {
    const updatedIntention = intention || row.intention_text;

    if (updatedIntention !== row.intention_text) {
      const patchError = await patchIntentionText(
        profileId,
        row.id,
        updatedIntention
      );

      if (patchError) {
        return {
          ok: false,
          error: "Niyet metni güncellenemedi.",
          debugCode: patchError.code ?? "INTENTION_PATCH_FAILED",
        };
      }
    }

    return {
      ok: true,
      manifesto: toRecord(
        { ...row, intention_text: updatedIntention },
        generatedToday
      ),
    };
  }

  try {
    const message = await generateManifestSentence({
      user,
      category: input.category,
      techniqueType: input.techniqueType,
      intention,
      currentDay: nextDay,
      maxDays,
    });

    const payload = buildDbPayload({
      profileId,
      category: input.category,
      techniqueType: input.techniqueType,
      intentionText: intention || row?.intention_text || "",
      currentDay: nextDay,
      maxDays,
      lastCheckedDate: today,
      dailyAiMessage: message,
    });

    const { row: savedRow, error: upsertError } = await upsertManifestoRow(
      profileId,
      payload
    );

    if (upsertError || !savedRow) {
      return {
        ok: false,
        error: "Manifesto kaydedilemedi.",
        debugCode: upsertError?.code ?? "UPSERT_FAILED",
      };
    }

    return {
      ok: true,
      manifesto: toRecord(savedRow, true),
    };
  } catch (error) {
    console.error("[manifestoService] generate failed:", {
      profileId,
      category: input.category,
      techniqueType: input.techniqueType,
      error: error instanceof Error ? error.message : error,
    });

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Günlük manifesto oluşturulamadı.",
      debugCode: "GENERATION_FAILED",
    };
  }
}
