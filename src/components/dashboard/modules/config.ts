export type ModuleId = "natal-chart" | "synastry" | "horary" | "tarot" | "cosmic-profile";

export interface DashboardModule {
  id: ModuleId;
  title: string;
  subtitle: string;
  description: string;
  icon: "chart" | "hearts" | "sky" | "tarot" | "profile";
  href?: string;
}

/** Home ekranındaki Oracle araçları — natal artık ayrı sekmede. */
export const ORACLE_TOOL_MODULES: DashboardModule[] = [
  {
    id: "horary",
    title: "Anlık Kozmik Soru (Horary)",
    subtitle: "Horary Astrology",
    description: "Sorunuzun sorulduğu ana göre kozmik yanıt alın.",
    icon: "sky",
    href: "/dashboard/oracle/horary",
  },
  {
    id: "cosmic-profile",
    title: "Kozmik Profil",
    subtitle: "Oracle Profil",
    description: "Doğum verileriyle kişisel kozmik imza analizi — 3 derinlik seviyesi.",
    icon: "profile",
  },
  {
    id: "tarot",
    title: "Tarot",
    subtitle: "Oracle Tarot",
    description: "Sorunuzu yıldızlara sorun; Oracle yorumlasın.",
    icon: "tarot",
  },
];

/** @deprecated Oracle Hub kaldırıldı; ORACLE_TOOL_MODULES kullanın. */
export const DASHBOARD_MODULES = ORACLE_TOOL_MODULES;
