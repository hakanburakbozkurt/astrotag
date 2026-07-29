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
  | { ok: false; error: string };
