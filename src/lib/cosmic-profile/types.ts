export type CosmicProfileTierId = "entry" | "depth" | "master";

export type EmphComplexity = CosmicProfileTierId;

export interface CosmicProfileTier {
  id: CosmicProfileTierId;
  label: string;
  stars: number;
  description: string;
}

export const COSMIC_PROFILE_TIERS: CosmicProfileTier[] = [
  {
    id: "entry",
    label: "Giriş",
    stars: 5,
    description: "Temel natal özet ve ana gerilim eksenleri",
  },
  {
    id: "depth",
    label: "Derinlik",
    stars: 8,
    description: "Transitler, evler ve genişletilmiş gerilim haritası",
  },
  {
    id: "master",
    label: "Detaylı",
    stars: 12,
    description: "Tam Emph paketi, synastry ve derin hikâye tohumları",
  },
];

export function getCosmicProfileTier(id: CosmicProfileTierId): CosmicProfileTier {
  const tier = COSMIC_PROFILE_TIERS.find((item) => item.id === id);
  if (!tier) {
    throw new Error("Geçersiz Kozmik Profil seviyesi.");
  }
  return tier;
}

export interface CosmicProfileFormInput {
  name: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthDistrict: string;
  tier: CosmicProfileTierId;
}

export interface CosmicProfileMeta {
  subject_name: string;
  birth_place: string;
  tier: CosmicProfileTierId;
  tier_label: string;
  encrypted: boolean;
}
