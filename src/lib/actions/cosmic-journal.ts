"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TarotReadingCard } from "@/lib/ai/tarot-pipeline-schemas";
import {
  type CosmicJournalFilter,
  type CosmicReadingRecord,
  type CosmicReadingType,
  type SynastryReadingMeta,
} from "@/lib/cosmic-journal/types";

export type {
  CosmicJournalFilter,
  CosmicReadingRecord,
  CosmicReadingType,
  SynastryReadingMeta,
};

const COSMIC_READINGS_TABLE = "cosmic_readings";

async function getServerAuthUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return null;
  }

  return user.id;
}

function parseCardsJson(value: unknown): TarotReadingCard[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const cards = value.filter(
    (item): item is TarotReadingCard =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as TarotReadingCard).id === "string" &&
      typeof (item as TarotReadingCard).name === "string"
  );

  return cards.length > 0 ? cards : null;
}

function parseSynastryJson(value: unknown): SynastryReadingMeta | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const partnerName = String(record.partner_name ?? "").trim();
  const analysis = String(record.analysis ?? "").trim();
  const score = Math.round(Number(record.compatibility_score ?? 0));

  if (!partnerName) {
    return null;
  }

  return {
    partner_name: partnerName,
    compatibility_score: Number.isFinite(score) ? score : 0,
    analysis,
  };
}

function mapRowToRecord(row: {
  id: unknown;
  type: unknown;
  question: unknown;
  reading_result: unknown;
  cards_json: unknown;
  created_at: unknown;
}): CosmicReadingRecord {
  const type = row.type as CosmicReadingType;

  return {
    id: row.id as string,
    type,
    question: row.question as string,
    reading_result: row.reading_result as string,
    cards: type === "Tarot" ? parseCardsJson(row.cards_json) : null,
    synastry: type === "Synastry" ? parseSynastryJson(row.cards_json) : null,
    created_at: row.created_at as string,
  };
}

export async function getCosmicJournalReadings(
  filter: CosmicJournalFilter = "all",
  limit = 40
): Promise<CosmicReadingRecord[]> {
  const userId = await getServerAuthUserId();
  if (!userId) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from(COSMIC_READINGS_TABLE)
    .select("id, type, question, reading_result, cards_json, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter !== "all") {
    query = query.eq("type", filter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("COSMIC_JOURNAL_FETCH_ERROR:", error.message);
    return [];
  }

  return (data ?? []).map(mapRowToRecord);
}
