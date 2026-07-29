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
    hint: "21 gün boyunca her sabah aynı manifesto cümlesini içselleştir.",
    icon: "calendar" as const,
    accent: "violet" as const,
  },
  {
    id: "5x55",
    label: "5×55 Tekniği",
    maxDays: 5,
    hint: "5 gün boyunca aynı cümleyi günde 55 kez yaz.",
    icon: "pen" as const,
    accent: "amber" as const,
  },
  {
    id: "3x33",
    label: "Tesla 3-33 Metodu",
    maxDays: 33,
    hint: "33 gün: sabah 3, öğle 6, akşam 9 kez — Tesla'nın sayısal odak ritmi.",
    icon: "zap" as const,
    accent: "cyan" as const,
  },
  {
    id: "369_method",
    label: "3-6-9 Ritüeli",
    maxDays: 9,
    hint: "9 gün: 3 gün ×3, 3 gün ×6, 3 gün ×9 tekrar amplifikasyonu.",
    icon: "hash" as const,
    accent: "rose" as const,
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
  modal_dismissed_date: string | null;
  created_at?: string;
  updated_at?: string;
};

import type { ManifestoPresentation } from "@/lib/manifesto/manifesto-presentation";

/** Uygulama katmanı DTO */
export type UserManifestoRecord = {
  id: string;
  category: ManifestoCategoryId;
  techniqueType: ManifestoTechniqueId;
  intention: string;
  currentDay: number;
  maxDays: number;
  lastCheckedDate: string | null;
  /** Ham DB metni (JSON veya legacy düz metin) */
  lastMessage: string | null;
  /** Çok katmanlı parse edilmiş manifesto */
  presentation: ManifestoPresentation | null;
  isComplete: boolean;
  generatedToday: boolean;
  modalDismissedDate: string | null;
};

export type DailyCosmicModalPayload = {
  showModal: boolean;
  manifesto: UserManifestoRecord | null;
  error?: string;
};

export type ManifestoHistoryItem = UserManifestoRecord & {
  categoryLabel: string;
  techniqueLabel: string;
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
  "id, profile_id, category, technique_type, intention_text, current_day, last_checked_date, daily_ai_message, is_completed, modal_dismissed_date, updated_at" as const;

export const MANIFESTO_UPSERT_CONFLICT_KEY =
  "profile_id,category,technique_type" as const;
