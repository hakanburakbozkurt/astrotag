export type ModuleId = "natal-chart" | "synastry" | "horary" | "ai-tarot";

export interface DashboardModule {
  id: ModuleId;
  title: string;
  subtitle: string;
  description: string;
  icon: "chart" | "hearts" | "sky" | "tarot";
  href?: string;
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: "natal-chart",
    title: "Doğum Haritası",
    subtitle: "Natal Chart",
    description: "Doğum anınızdaki gezegen dizilimini analiz edin.",
    icon: "chart",
  },
  {
    id: "horary",
    title: "Anlık Kozmik Soru (Horary)",
    subtitle: "Horary Astrology",
    description: "Sorunuzun sorulduğu ana göre kozmik yanıt alın.",
    icon: "sky",
    href: "/dashboard/horary",
  },
  {
    id: "ai-tarot",
    title: "AI Tarot",
    subtitle: "Gelecek Vizyonu",
    description: "Sorunuzu yıldızlara sorun, AI yorumlasın.",
    icon: "tarot",
  },
];
