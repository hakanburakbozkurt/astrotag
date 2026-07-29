export const MANIFESTO_CATEGORIES = [
  { id: "para", label: "Para & Bolluk" },
  { id: "is_kariyer", label: "İş & Kariyer" },
  { id: "ask", label: "Aşk & İlişki" },
  { id: "saglik", label: "Sağlık & Enerji" },
  { id: "ozguven", label: "Özgüven" },
  { id: "ruhsal", label: "Ruhsal Büyüme" },
] as const;

export type ManifestoCategoryId = (typeof MANIFESTO_CATEGORIES)[number]["id"];

export const MANIFESTO_TECHNIQUES = [
  {
    id: "21_days",
    label: "21 Gün Kuralı",
    maxDays: 21,
    hint: "21 gün boyunca her gün tek bir niyet cümlesi.",
  },
  {
    id: "5x55",
    label: "5×55 Tekniği",
    maxDays: 5,
    hint: "5 gün boyunca aynı cümleyi günde 55 kez yaz.",
  },
] as const;

export type ManifestoTechniqueId = (typeof MANIFESTO_TECHNIQUES)[number]["id"];

/** Supabase user_manifestos satırı — sütun adları birebir eşleşmeli */
export type ManifestoDbRow = {
  id: string;
  profile_id: string;
  category: string;
  technique_type: string;
  intention_text: string;
  current_day: number;
  last_checked_date: string | null;
  daily_ai_message: string | null;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
};

/** Uygulama katmanı DTO */
export type UserManifestoRecord = {
  id: string;
  category: ManifestoCategoryId;
  techniqueType: ManifestoTechniqueId;
  intention: string;
  currentDay: number;
  maxDays: number;
  lastCheckedDate: string | null;
  lastMessage: string | null;
  isComplete: boolean;
  generatedToday: boolean;
};

export type GenerateManifestoInput = {
  category: ManifestoCategoryId;
  techniqueType: ManifestoTechniqueId;
  intention: string;
};

export type GenerateManifestoResult =
  | { ok: true; manifesto: UserManifestoRecord }
  | { ok: false; error: string; debugCode?: string };

export const MANIFESTO_DB_COLUMNS =
  "id, profile_id, category, technique_type, intention_text, current_day, last_checked_date, daily_ai_message, is_completed, updated_at" as const;

export const MANIFESTO_UPSERT_CONFLICT_KEY =
  "profile_id,category,technique_type" as const;
