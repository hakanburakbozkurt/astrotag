import type { CosmicProfileMeta } from "@/lib/cosmic-profile/types";
import type { TarotReadingCard } from "@/lib/ai/tarot-pipeline-schemas";

export type CosmicReadingType = "Tarot" | "Horary" | "Synastry" | "CosmicProfile";

export interface SynastryReadingMeta {
  partner_name: string;
  compatibility_score: number;
  analysis: string;
}

export interface CosmicReadingRecord {
  id: string;
  type: CosmicReadingType;
  question: string;
  reading_result: string;
  cards: TarotReadingCard[] | null;
  synastry: SynastryReadingMeta | null;
  cosmicProfile: CosmicProfileMeta | null;
  created_at: string;
}

export type CosmicJournalFilter = "all" | CosmicReadingType;

export const READING_TYPE_META: Record<
  CosmicReadingType,
  { code: string; label: string; accent: string }
> = {
  Tarot: {
    code: "TRT",
    label: "Tarot",
    accent: "border-amber-400/35 bg-amber-400/10 text-amber-200/90",
  },
  Horary: {
    code: "HOR",
    label: "Horary",
    accent: "border-violet-400/30 bg-violet-400/10 text-violet-200/85",
  },
  Synastry: {
    code: "SYN",
    label: "Synastry",
    accent: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200/85",
  },
  CosmicProfile: {
    code: "KPF",
    label: "Kozmik Profil",
    accent: "border-sky-400/30 bg-sky-400/10 text-sky-200/85",
  },
};
