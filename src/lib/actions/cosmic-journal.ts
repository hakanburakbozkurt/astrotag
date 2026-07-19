"use server";

import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { TarotReadingCard } from "@/lib/ai/tarot-pipeline-schemas";
import { decryptCosmicJournalText } from "@/lib/crypto/cosmic-journal-crypto.server";
import type {
  CosmicProfileMeta,
} from "@/lib/cosmic-profile/types";
import type {
  CosmicReadingRecord,
  CosmicReadingType,
  SynastryReadingMeta,
} from "@/lib/cosmic-journal/types";

const COSMIC_READINGS_TABLE = "cosmic_readings";

async function getServerAuthUserId(): Promise<string | null> {
  return getNfcSessionProfileId();
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

function parseCosmicProfileJson(value: unknown): CosmicProfileMeta | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const subjectName = String(record.subject_name ?? "").trim();
  const birthPlace = String(record.birth_place ?? "").trim();
  const tier = String(record.tier ?? "") as CosmicProfileMeta["tier"];

  if (!subjectName || !birthPlace || !tier) {
    return null;
  }

  return {
    subject_name: subjectName,
    birth_place: birthPlace,
    tier,
    tier_label: String(record.tier_label ?? tier),
    encrypted: Boolean(record.encrypted),
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
  const rawReading = String(row.reading_result ?? "");
  const readingResult = decryptCosmicJournalText(rawReading);

  return {
    id: row.id as string,
    type,
    question: row.question as string,
    reading_result: readingResult,
    cards: type === "Tarot" ? parseCardsJson(row.cards_json) : null,
    synastry: type === "Synastry" ? parseSynastryJson(row.cards_json) : null,
    cosmicProfile:
      type === "CosmicProfile" ? parseCosmicProfileJson(row.cards_json) : null,
    created_at: row.created_at as string,
  };
}

export async function getCosmicJournalReadings(
  filter: CosmicReadingType | "all" = "all",
  limit = 40
): Promise<CosmicReadingRecord[]> {
  const profileId = await getServerAuthUserId();
  if (!profileId) {
    return [];
  }

  const supabaseAdmin = createServiceRoleClient();
  let query = supabaseAdmin
    .from(COSMIC_READINGS_TABLE)
    .select("id, type, question, reading_result, cards_json, created_at")
    .eq("user_id", profileId)
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
