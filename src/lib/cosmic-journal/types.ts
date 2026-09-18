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
    accent: "border-zinc-700 bg-zinc-900 text-stone-300",
  },
  Horary: {
    code: "HOR",
    label: "Horary",
    accent: "border-zinc-700 bg-zinc-900 text-stone-300",
  },
  Synastry: {
    code: "SYN",
    label: "Synastry",
    accent: "border-zinc-600 bg-zinc-900/90 text-stone-300",
  },
  CosmicProfile: {
    code: "KPF",
    label: "Kozmik Profil",
    accent: "border-zinc-800 bg-zinc-950 text-stone-400",
  },
};
