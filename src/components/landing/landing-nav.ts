export interface LandingNavItem {
  label: string;
  href: string;
  description?: string;
}

export const LANDING_NAV_ITEMS: LandingNavItem[] = [
  {
    label: "Keşfet",
    href: "#ozellikler",
    description: "Natal harita, Nexus ve Oracle",
  },
  {
    label: "Yıldız Paketleri",
    href: "#yildiz-paketleri",
    description: "Kozmik kredi vitrini",
  },
  {
    label: "Güven",
    href: "#guven",
    description: "Gizlilik ve astronomik doğruluk",
  },
  {
    label: "Destek",
    href: "#destek",
    description: "Yardım ve iletişim",
  },
];

export const ORACLE_FEATURE_CARDS = [
  {
    id: "natal",
    title: "Natal Harita",
    description:
      "Doğum anının gökyüzü haritasını oku; güçlü yanların ve yaşam temaların netleşsin.",
  },
  {
    id: "nexus",
    title: "Günlük Nexus",
    description:
      "Her sabah kişisel kozmik nabzın; günün enerjisi, odak alanın ve rehber mesajın.",
  },
  {
    id: "oracle",
    title: "Tarot & Horary",
    description:
      "Anlık sorularına sembol diliyle yanıt al; derin içgörü ve evet-hayır rehberliği.",
  },
] as const;

export const TRUST_ITEMS = [
  {
    id: "privacy",
    title: "Gizlilik öncelikli",
    description: "Verilerin şifreli ve yalnızca senin hesabında.",
  },
  {
    id: "ephemeris",
    title: "Gerçek ephemeris",
    description: "Swiss Ephemeris ile astronomik doğruluk.",
  },
  {
    id: "turkish",
    title: "Türkçe AI yorum",
    description: "Kişisel, anlaşılır ve mistik tonlu rehberlik.",
  },
] as const;
